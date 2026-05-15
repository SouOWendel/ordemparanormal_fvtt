/**
 * Useful links:
 * https://foundryvtt.com/api/functions/foundry.utils.mergeObject.html
 * https://github.com/foundryvtt/dnd5e/blob/3e9da363d92825175df22c319074274870d10309/module/migration.mjs#L23
 * https://foundryvtt.com/api/classes/foundry.abstract.Document.html#toObject
 */

/**
 * Perform a system migration for the entire World, applying migrations for Actors and Items.
 * @returns {Promise}      A Promise which resolves once the migration is completed
 */
export async function migrateWorld({ bypassVersionCheck = false } = {}) {
	const gameVersion = game.system.version;

	const actors = game.actors
		.map((a) => [a, true])
		.concat(Array.from(game.actors.invalidDocumentIds).map((id) => [game.actors.getInvalid(id), false]));

	for (const [actor, valid] of actors) {
		try {
			// Transforms actor model data into flat object.
			const flags = { bypassVersionCheck, persistSourceMigration: false };
			const source = valid ? actor.toObject() : game.data.actors.find((a) => a._id === actor.id);
			const version = actor._stats.systemVersion; // Version in which the sheet is created.
			const updateData = migrateActorData(actor, source, flags);
			if (!foundry.utils.isEmpty(updateData)) {
				console.log(`Migrando os seus dados para a versão ${gameVersion}.`);
				ui.notifications.info(`Migrando documento de Ator ${actor.name} (${version})`);
				await actor.update(updateData, { enforceTypes: false, diff: valid, render: false });
			}
		} catch (err) {
			err.message = `O sistema Ordem Paranormal falhou para o Ator ${actor.name}: ${err.message}`;
			console.error(err);
		}
	}
	// Migrate standalone world items
	for (const item of game.items) {
		try {
			const itemUpdate = {};
			await _migrateItemImage(item, itemUpdate);
			if (!foundry.utils.isEmpty(itemUpdate)) {
				console.log(`Migrando item ${item.name}.`);
				await item.update(itemUpdate, { enforceTypes: false, diff: true, render: false });
			}
		} catch (err) {
			err.message = `O sistema Ordem Paranormal falhou para o Item ${item.name}: ${err.message}`;
			console.error(err);
		}
	}

	// Migrate scene token actors
	for (const scene of game.scenes) {
		for (const token of scene.tokens) {
			const tokenActor = token.actor;
			if (!tokenActor || tokenActor.isLinked) continue;
			try {
				const source = tokenActor.toObject();
				const flags = { bypassVersionCheck, persistSourceMigration: false };
				const updateData = migrateActorData(tokenActor, source, flags);
				if (!foundry.utils.isEmpty(updateData)) {
					console.log(`Migrando token ${token.name} na cena ${scene.name}.`);
					await tokenActor.update(updateData, { enforceTypes: false, diff: true, render: false });
				}
			} catch (err) {
				err.message = `O sistema Ordem Paranormal falhou para o Token ${token.name}: ${err.message}`;
				console.error(err);
			}
		}
	}

	// Set the migration as complete
	game.settings.set("ordemparanormal", "systemMigrationVersion", game.system.version);
	ui.notifications.info(`Migração da versão ${gameVersion} está completa!`, { permanent: true });
}

/**
 *
 * @param {*} actor
 * @param {*} actorData
 * @param {*} migrationDataOrFlags
 * @param {*} flags
 * @returns
 */
export async function migrateActorData(actor, actorData, migrationDataOrFlags = {}, flags = {}) {
	flags = _resolveMigrationFlags(migrationDataOrFlags, flags);
	const updateData = {};
	// isNewerVersion return whether a target version is more advanced than some other reference version.
	if (foundry.utils.isNewerVersion("6.3.1", actorData._stats?.systemVersion) || flags.bypassVersionCheck) {
		if (actorData.system?.class == "Combatente") updateData["system.class"] = "fighter";
		if (actorData.system?.class == "Especialista") updateData["system.class"] = "specialist";
		if (actorData.system?.class == "Ocultista") updateData["system.class"] = "occultist";
	}

	// The degree path changed in 6.9.2 version.
	if (foundry.utils.isNewerVersion("6.9.2", actorData._stats?.systemVersion) || flags.bypassVersionCheck) {
		for (const [keySkill] of Object.entries(actorData.system.skills)) {
			if (typeof actorData.system?.skills[keySkill]?.degree == "string") {
				updateData[`system.skills.${keySkill}.degree.label`] = actorData.system?.skills[keySkill]?.degree;
			}
		}
	}

	// Migração de imagens renomeadas - versão 7.3.0
	if (foundry.utils.isNewerVersion("7.3.0", actorData._stats?.systemVersion) || flags.bypassVersionCheck) {
		for (const item of actor.items) {
			const itemUpdate = {};
			const newImg = await _getMigratedItemImagePath(item);
			if (newImg && newImg !== item.img) {
				itemUpdate.img = newImg;
				console.log(`Atualizando imagem do item ${item.name}: ${item.img} → ${newImg}`);
			}

			if (!foundry.utils.isEmpty(itemUpdate)) {
				await item.update(itemUpdate);
			}
		}
		if (!foundry.utils.isEmpty(updateData)) {
			console.log(`Imagens dos itens do ator ${actor.name} foram atualizadas na migração para a versão 7.3.0.`);
		}
	}
	return updateData;
}

/**
 * Migrate a single standalone item's image path (same logic as actor-embedded items).
 * @param {Item} item
 * @param {object} updateData  Mutated in place with any needed updates.
 */
async function _migrateItemImage(item, updateData) {
	const newImg = await _getMigratedItemImagePath(item);
	if (newImg && newImg !== item.img) updateData.img = newImg;
}

function _resolveMigrationFlags(migrationDataOrFlags, flags) {
	if (Object.keys(flags ?? {}).length > 0) return flags;
	if (migrationDataOrFlags?.bypassVersionCheck !== undefined) return migrationDataOrFlags;
	return {};
}

async function _getMigratedItemImagePath(item) {
	const itemImg = item.img;
	if (!itemImg || !itemImg.includes("media/icons/")) return null;

	const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	const findInEquipments = async (normalizedFileName) => {
		const subfolders = ["accessories", "ammunition", "explosives", "operational", "paranormal"];
		const basePath = "systems/ordemparanormal/media/icons/equipments";
		for (const folder of subfolders) {
			const testPath = `${basePath}/${folder}/${normalizedFileName}`;
			try {
				const response = await fetch(testPath, { method: "HEAD" });
				if (response.ok) return testPath;
			} catch (err) {
				console.error(`Erro ao verificar o arquivo ${testPath}:`, err);
			}
		}
		return null;
	};

	let needsUpdate = false;
	let newImg = itemImg;
	let isEquipmentItem = false;

	if (newImg.includes("general%20equipments") || newImg.includes("general equipments")) {
		if (item.type === "protection") {
			newImg = newImg.replace("general%20equipments", "protections").replace("general equipments", "protections");
		} else {
			isEquipmentItem = true;
		}
		needsUpdate = true;
	}

	const parts = newImg.split("/");
	const fileName = parts[parts.length - 1];
	const decodedFileName = decodeURIComponent(fileName);
	const normalizedFileName = removeAccents(decodedFileName).toLowerCase().replace(/\s+/g, "-");

	if (isEquipmentItem) {
		const foundPath = await findInEquipments(normalizedFileName);
		newImg = foundPath ?? `systems/ordemparanormal/media/icons/equipments/${normalizedFileName}`;
		needsUpdate = true;
	} else if (decodedFileName !== normalizedFileName) {
		parts[parts.length - 1] = normalizedFileName;
		newImg = parts.join("/");
		needsUpdate = true;
	}

	if (needsUpdate && newImg !== itemImg) return newImg;
	return null;
}
