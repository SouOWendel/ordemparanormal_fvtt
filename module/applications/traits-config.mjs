
/**
 * Configuração de características para atores
 */
export class TraitsConfig extends FormApplication {
	/**
	 * @override
	 */
	static get defaultOptions() {
		// CORREÇÃO: Usar foundry.utils.mergeObject
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ['ordemparanormal', 'sheet', 'traits-config'],
			template: 'systems/ordemparanormal/templates/apps/traits-config.hbs',
			width: 420,
			height: 'auto',
			title: 'Configurar Características',
			resizable: false,
		});
	}

	/** @override */
	getData() {
		const data = super.getData();
		
		// Pega a lista de tipos de dano da configuração do sistema
		data.traits = CONFIG.op.traits;
		
		// Pega os dados atuais do ator (ou cria um objeto vazio se não existir)
		const actorTraits = this.object.system.traits || {};

		// Prepara o objeto para o template Handlebars
		data.traits = {};

		for (const [key, label] of Object.entries(CONFIG.op.traits)) {
			data.traits[key] = {
				label: label,
				enabled: actorTraits[key]
			};
		}
		
		return data;
	}

	/** @override */
	async _updateObject(event, formData) {
		// CORREÇÃO: Usar foundry.utils.expandObject
		const traits = foundry.utils.expandObject(formData);
		
		// Atualiza o ator
		return this.object.update({
			'system.traits': traits
		});
	}
}
