/**
 * Custom Combat document class for Ordem Paranormal.
 * Handles initiative tiebreaking by Agility (dex) attribute or re-roll.
 */
export class OrdemCombat extends Combat {
	/**
	 * Roll initiative for all combatants, then handle reroll tiebreaker if enabled.
	 * @override
	 */
	async rollAll(options = {}) {
		await super.rollAll(options);

		const tiebreaker = game.settings?.get?.("ordemparanormal", "initiativeTiebreaker") ?? "dex";
		if (tiebreaker !== "reroll") return;

		// Agrupar combatentes por valor de iniciativa
		const withInit = this.combatants.filter((c) => Number.isNumeric(c.initiative));
		const groups = new Map();
		for (const c of withInit) {
			if (!groups.has(c.initiative)) groups.set(c.initiative, []);
			groups.get(c.initiative).push(c);
		}

		// Re-rolar apenas grupos com 2+ combatentes empatados
		const updates = [];
		for (const [initValue, group] of groups) {
			if (group.length < 2) continue;
			for (const combatant of group) {
				if (!combatant.actor) continue;
				const roll = combatant.getInitiativeRoll();
				await roll.evaluate();
				// Adiciona offset fracionário invisível (preserva display value)
				updates.push({ _id: combatant.id, initiative: initValue + roll.total / 10000 });
			}
		}

		if (updates.length) await this.updateEmbeddedDocuments("Combatant", updates);
	}

	/**
	 * Sort combatants: higher initiative first; ties broken by Agility (dex) descending.
	 * @override
	 */
	_sortCombatants(a, b) {
		const ia = Number.isNumeric(a.initiative) ? a.initiative : -Infinity;
		const ib = Number.isNumeric(b.initiative) ? b.initiative : -Infinity;
		if (ib !== ia) return ib - ia;

		const tiebreaker = game.settings?.get?.("ordemparanormal", "initiativeTiebreaker") ?? "dex";
		if (tiebreaker === "dex") {
			const dexA = a.actor?.system?.attributes?.dex?.value ?? 0;
			const dexB = b.actor?.system?.attributes?.dex?.value ?? 0;
			return dexB - dexA;
		}
		return 0;
	}
}
