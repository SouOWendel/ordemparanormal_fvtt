import { op } from '../helpers/config.mjs';

/**
 * Configuração de resistências a danos para atores
 */
export class ResistanceConfig extends FormApplication {
	/**
	 * @override
	 */
	static get defaultOptions() {
		// CORREÇÃO: Usar foundry.utils.mergeObject
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ['ordemparanormal', 'sheet', 'resistance-config'],
			template: 'systems/ordemparanormal/templates/apps/resistance-config.hbs',
			width: 420,
			height: 'auto',
			title: 'Configurar Resistências',
			resizable: false,
		});
	}

	/** @override */
	getData() {
		const data = super.getData();
		
		// Pega a lista de tipos de dano da configuração do sistema
		data.damageTypes = op.dropdownDamageType; 
		
		// Pega os dados atuais do ator (ou cria um objeto vazio se não existir)
		const actorResistances = this.object.system.resistances || {};

		// Prepara o objeto para o template Handlebars
		data.resistances = {};

		for (const [key, label] of Object.entries(data.damageTypes)) {
			data.resistances[key] = {
				label: label,
				// Se o ator já tem dados salvos, usa. Se não, usa padrão (0/false)
				value: actorResistances[key]?.value || 0,
				vulnerable: actorResistances[key]?.vulnerable || false,
				immune: actorResistances[key]?.immune || false
			};
		}

		return data;
	}

	/** @override */
	async _updateObject(event, formData) {
		// CORREÇÃO: Usar foundry.utils.expandObject
		const resistances = foundry.utils.expandObject(formData);
		
		// Atualiza o ator
		return this.object.update({
			'system.resistances': resistances
		});
	}
}
