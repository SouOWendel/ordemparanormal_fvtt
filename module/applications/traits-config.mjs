import ApplicationOP from "./application.mjs";

export class TraitsConfig extends ApplicationOP {
	static DEFAULT_OPTIONS = {
		classes: ["ordemparanormal", "sheet", "traits-config"],
		position: { width: 420 },
		window: { title: "Configurar Características", resizable: false },
		form: {
			handler: TraitsConfig.#onSubmit,
			submitOnChange: false,
		},
	};

	static PARTS = {
		form: { template: "systems/ordemparanormal/templates/apps/traits-config.hbs" },
	};

	get document() {
		return this.options.document;
	}

	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		const actorTraits = this.document.system.traits || {};
		context.traits = {};
		for (const [key, label] of Object.entries(CONFIG.op.traits)) {
			context.traits[key] = {
				label,
				enabled: actorTraits[key],
			};
		}
		return context;
	}

	static async #onSubmit(event, form, formData) {
		const traits = foundry.utils.expandObject(formData.object);
		await this.document.update({ "system.traits": traits });
	}
}
