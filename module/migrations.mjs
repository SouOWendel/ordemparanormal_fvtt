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
export async function migrateWorld({bypassVersionCheck=false}={}) {
	const gameVersion = game.system.version;

	const actors = game.actors.map(a => [a, true])
		.concat(Array.from(game.actors.invalidDocumentIds)
			.map(id => [game.actors.getInvalid(id), false]));

	for ( const [actor, valid] of actors ) {
		try {
			// Transforms actor model data into flat object.
			const flags = { bypassVersionCheck, persistSourceMigration: false };
			const source = valid ? actor.toObject() : game.data.actors.find(a => a._id === actor.id);
			const version = actor._stats.systemVersion; // Version in which the sheet is created.
			const updateData = migrateActorData(actor, source, flags, { actorUuid: actor.uuid });
			if (!foundry.utils.isEmpty(updateData)) {
				console.log(`Migrando os seus dados para a versão ${gameVersion}.`);
				ui.notifications.info(`Migrando documento de Ator ${actor.name} (${version})`);
				await actor.update(updateData, {enforceTypes: false, diff: valid, render: false});
			}
		} catch(err) {
			err.message = `O sistema Ordem Paranormal falhou para o Ator ${actor.name}: ${err.message}`;
			console.error(err);
		}
	}
	// Set the migration as complete
	game.settings.set('ordemparanormal', 'systemMigrationVersion', game.system.version);
	ui.notifications.info(`Migração da versão ${gameVersion} está completa!`, {permanent: true});
}

/**
 * 
 * @param {*} actor 
 * @param {*} actorData 
 * @param {*} migrationData 
 * @param {*} flags 
 * @param {*} param4 
 * @returns 
 */
export async function migrateActorData(actor, actorData, migrationData, flags={}, { actorUuid }={}) {
	const updateData = {};
	// isNewerVersion return whether a target version is more advanced than some other reference version.
	if (foundry.utils.isNewerVersion('6.3.1', actorData._stats?.systemVersion) || flags.bypassVersionCheck) {
		if (actorData.system?.class == 'Combatente') updateData['system.class'] = 'fighter';
		if (actorData.system?.class == 'Especialista') updateData['system.class'] = 'specialist';
		if (actorData.system?.class == 'Ocultista') updateData['system.class'] = 'occultist';
	}

	// The degree path changed in 6.9.2 version.
	if (foundry.utils.isNewerVersion('6.9.2', actorData._stats?.systemVersion) || flags.bypassVersionCheck) {
		for (const [keySkill] of Object.entries(actorData.system.skills)) {
			if (typeof actorData.system?.skills[keySkill]?.degree == 'string') {
				updateData[`system.skills.${keySkill}.degree.label`] = actorData.system?.skills[keySkill]?.degree;
			}
		}
	}

	// Migração de imagens renomeadas - versão 7.3.0
	if (foundry.utils.isNewerVersion('7.3.0', actorData._stats?.systemVersion) || flags.bypassVersionCheck) {
		// Função para remover acentos e caracteres especiais
		const removeAccents = (str) => {
			return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		};
		
		// Função para buscar arquivo em subpastas de equipments
		const findInEquipments = async (normalizedFileName) => {
			const subfolders = ['accessories', 'ammunition', 'explosives', 'operational', 'paranormal'];
			const basePath = 'systems/ordemparanormal/media/icons/equipments';
			
			for (const folder of subfolders) {
				const testPath = `${basePath}/${folder}/${normalizedFileName}`;
				try {
					// Verifica se o arquivo existe usando FilePicker
					const response = await fetch(testPath, { method: 'HEAD' });
					if (response.ok) {
						return testPath;
					}
				} catch (err) {
					console.error(`Erro ao verificar o arquivo ${testPath}:`, err);
				}
			}
			return null;
		};
		
		for (const item of actor.items) {
			const itemUpdate = {};
			const itemImg = item.img;
			
			// Verifica se a imagem está no caminho media/icons/
			if (itemImg && itemImg.includes('media/icons/')) {
				let needsUpdate = false;
				let newImg = itemImg;
				let isEquipmentItem = false;
				
				// Corrige pasta "general equipments" ou "general%20equipments"
				if (newImg.includes('general%20equipments') || newImg.includes('general equipments')) {
					// Para itens do tipo protection, move para pasta protections
					if (item.type === 'protection') {
						newImg = newImg.replace('general%20equipments', 'protections');
						newImg = newImg.replace('general equipments', 'protections');
					} else {
						// Para outros itens, marca como equipment para busca
						isEquipmentItem = true;
					}
					needsUpdate = true;
				}
				
				// Extrai o nome do arquivo e converte para minúsculas com hífens
				const parts = newImg.split('/');
				const fileName = parts[parts.length - 1];
				
				// Decodifica URL encoding (ex: %20 → espaço, %C3%A3 → ã)
				const decodedFileName = decodeURIComponent(fileName);
				
				// Remove acentos, converte para minúsculas e substitui espaços por hífens
				const normalizedFileName = removeAccents(decodedFileName)
					.toLowerCase()
					.replace(/\s+/g, '-');
				
				// Se é um item de equipment, busca nas subpastas
				if (isEquipmentItem) {
					const foundPath = await findInEquipments(normalizedFileName);
					if (foundPath) {
						newImg = foundPath;
						needsUpdate = true;
					} else {
						// Se não encontrou, usa o caminho base com nome normalizado
						newImg = `systems/ordemparanormal/media/icons/equipments/${normalizedFileName}`;
						needsUpdate = true;
					}
				} else if (decodedFileName !== normalizedFileName) {
					// Para outros tipos, apenas atualiza o nome do arquivo
					parts[parts.length - 1] = normalizedFileName;
					newImg = parts.join('/');
					needsUpdate = true;
				}
				
				// Aplica a atualização se necessário
				if (needsUpdate && newImg !== itemImg) {
					itemUpdate.img = newImg;
					console.log(`Atualizando imagem do item ${item.name}: ${itemImg} → ${newImg}`);
				}
			}
			
			if (!foundry.utils.isEmpty(itemUpdate)) {
				await item.update(itemUpdate);
			}
		}
	}
	return updateData;
}