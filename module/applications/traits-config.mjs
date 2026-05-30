const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Configuração de características para atores (V2)
 */
export class TraitsConfig extends HandlebarsApplicationMixin(ApplicationV2) {
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["ordemparanormal", "sheet", "traits-config"],
		tag: "form",
		position: {
			width: 420,
			height: "auto",
		},
		window: {
			title: "Configurar Características",
			resizable: false,
		},
		form: {
			handler: TraitsConfig.#onSubmitForm,
			closeOnSubmit: true,
			submitOnChange: false,
		},
	};

	/** @inheritDoc */
	static PARTS = {
		form: {
			template: "systems/ordemparanormal/templates/apps/traits-config.hbs",
		},
	};

	/** @inheritDoc */
	get document() {
		return this.options.document;
	}

	/** @override */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		// Pega a lista de características da configuração do sistema
		const allTraits = CONFIG.op.traits;

		// Pega os dados atuais do ator (ou cria um objeto vazio se não existir)
		const actorTraits = this.document.system.traits || {};

		// Prepara o objeto para o template Handlebars
		context.traits = {};

		for (const [key, label] of Object.entries(allTraits)) {
			context.traits[key] = {
				label: label,
				enabled: actorTraits[key],
			};
		}

		return context;
	}

	/**
	 * Handle form submission
	 * @this {TraitsConfig}
	 * @param {SubmitEvent} event
	 * @param {HTMLFormElement} form
	 * @param {FormDataExtended} formData
	 */
	static async #onSubmitForm(event, form, formData) {
		event.preventDefault();
		const traits = foundry.utils.expandObject(formData.object);
		await this.document.update({ "system.traits": traits });
	}
}
