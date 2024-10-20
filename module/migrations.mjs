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
			// Transforma o modelo de dados do ator em um objeto plano.
			const flags = { bypassVersionCheck, persistSourceMigration: false };
			const source = valid ? actor.toObject() : game.data.actors.find(a => a._id === actor.id);
			const version = actor._stats.systemVersion; // Versão em que a ficha foi criada.
			const updateData = migrateActorData(actor, source, flags, { actorUuid: actor.uuid });
			if (!foundry.utils.isEmpty(updateData)) {
				ui.notifications.info(`Migrando os seus dados para a versão ${gameVersion}.`, {permanent: true});
				console.log(`Migrando documento de Ator ${actor.name} (${version})`);
				await actor.update(updateData, {enforceTypes: false, diff: valid, render: false});
			}
		} catch(err) {
			err.message = `O sistema Ordem Paranormal falhou para o Ator ${actor.name}: ${err.message}`;
			console.error(err);
		}
	}
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
export function migrateActorData(actor, actorData, migrationData, flags={}, { actorUuid }={}) {
	const updateData = {};
	// isNewerVersion return whether a target version is more advanced than some other reference version.
	if (foundry.utils.isNewerVersion('6.3.1', actorData._stats?.systemVersion) || flags.bypassVersionCheck) {
		if (actorData.system?.class == 'Combatente') updateData['system.class'] = 'fighter';
		if (actorData.system?.class == 'Especialista') updateData['system.class'] = 'specialist';
		if (actorData.system?.class == 'Ocultista') updateData['system.class'] = 'occultist';
	}
	return updateData;
}