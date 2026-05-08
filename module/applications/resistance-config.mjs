import { op } from "../helpers/config.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Configuração de resistências a danos para atores (V2)
 */
export class ResistanceConfig extends HandlebarsApplicationMixin(ApplicationV2) {
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["ordemparanormal", "sheet", "resistance-config"],
		tag: "form",
		position: {
			width: 420,
			height: "auto",
		},
		window: {
			title: "Configurar Resistências",
			resizable: false,
		},
		form: {
			handler: ResistanceConfig.#onSubmitForm,
			closeOnSubmit: true,
			submitOnChange: false,
		},
	};

	/** @inheritDoc */
	static PARTS = {
		form: {
			template: "systems/ordemparanormal/templates/apps/resistance-config.hbs",
		},
	};

	/** @inheritDoc */
	get document() {
		return this.options.document;
	}

	/** @override */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		// Pega a lista de tipos de dano da configuração do sistema
		context.damageTypes = op.dropdownDamageType;

		// Pega os dados atuais do ator (ou cria um objeto vazio se não existir)
		const actorResistances = this.document.system.resistances || {};

		// Prepara o objeto para o template Handlebars
		context.resistances = {};

		for (const [key, label] of Object.entries(context.damageTypes)) {
			context.resistances[key] = {
				label: label,
				// Se o ator já tem dados salvos, usa. Se não, usa padrão (0/false)
				value: actorResistances[key]?.value || 0,
				vulnerable: actorResistances[key]?.vulnerable || false,
				immune: actorResistances[key]?.immune || false,
			};
		}

		return context;
	}

	/**
	 * Handle form submission
	 * @this {ResistanceConfig}
	 * @param {SubmitEvent} event
	 * @param {HTMLFormElement} form
	 * @param {FormDataExtended} formData
	 */
	static async #onSubmitForm(event, form, formData) {
		event.preventDefault();
		const resistances = foundry.utils.expandObject(formData.object);
		await this.document.update({ "system.resistances": resistances });
	}
}
