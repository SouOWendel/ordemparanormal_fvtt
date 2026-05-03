import ApplicationOP from "./application.mjs";
import { op } from "../helpers/config.mjs";

export class ResistanceConfig extends ApplicationOP {
	static DEFAULT_OPTIONS = {
		classes: ["ordemparanormal", "sheet", "resistance-config"],
		position: { width: 420 },
		window: { title: "Configurar Resistências", resizable: false },
		form: {
			handler: ResistanceConfig.#onSubmit,
			submitOnChange: false,
		},
	};

	static PARTS = {
		form: { template: "systems/ordemparanormal/templates/apps/resistance-config.hbs" },
	};

	get document() {
		return this.options.document;
	}

	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.damageTypes = op.dropdownDamageType;
		const actorResistances = this.document.system.resistances || {};
		context.resistances = {};
		for (const [key, label] of Object.entries(context.damageTypes)) {
			context.resistances[key] = {
				label,
				value: actorResistances[key]?.value || 0,
				vulnerable: actorResistances[key]?.vulnerable || false,
				immune: actorResistances[key]?.immune || false,
			};
		}
		return context;
	}

	static async #onSubmit(event, form, formData) {
		const resistances = foundry.utils.expandObject(formData.object);
		await this.document.update({ "system.resistances": resistances });
	}
}
