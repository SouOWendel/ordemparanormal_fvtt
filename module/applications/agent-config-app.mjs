const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class AgentConfigApp extends HandlebarsApplicationMixin(ApplicationV2) {
	static DEFAULT_OPTIONS = {
		classes: ["ordemparanormal", "sheet", "agent-config"],
		tag: "form",
		position: {
			width: 450,
			height: "auto",
		},
		window: {
			title: "Configurações do Agente",
			resizable: false,
		},
		form: {
			handler: AgentConfigApp.#onSubmitForm,
			closeOnSubmit: true,
			submitOnChange: false,
		},
	};

	static PARTS = {
		form: {
			template: "systems/ordemparanormal/templates/apps/agent-config.hbs",
		},
	};

	constructor(actor, options = {}) {
		super({ ...options, document: actor });
		this.actor = actor;
	}

	get document() {
		return this.options.document;
	}

	_initializeApplicationOptions(options) {
		options = super._initializeApplicationOptions(options);
		console.log("AgentConfigApp options:", options);
		options.uniqueId = `agent-config-${options.document.uuid}`;
		options.window.title = `Configurações: ${options.document.name}`;
		return options;
	}

	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		return {
			...context,
			actor: this.actor,
			system: this.actor.system,
		};
	}

	static async #onSubmitForm(event, form, formData) {
		event.preventDefault();
		const updates = foundry.utils.expandObject(formData.object);
		await this.document.update(updates);
	}
}
