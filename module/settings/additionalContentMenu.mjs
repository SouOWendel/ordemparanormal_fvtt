/**
 *
 */
export class AdditionalContentMenu extends FormApplication {
	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["ordemparanormal", "sheet"],
			template: "systems/ordemparanormal/templates/settings/additionalContentsMenu.html",
			closeOnSubmit: false,
			submitOnClose: true,
			submitOnChange: true,
			width: 540,
			height: 440,
			top: 150,
			left: 150,
		});
	}

	/**  */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		const class1 = {
			newClasses: game.settings.get("ordemparanormal", "newClasses"),
			newOrigins: game.settings.get("ordemparanormal", "newOrigins"),
			newTrails: game.settings.get("ordemparanormal", "newTrails"),
		};

		console.log(class1);
		return context;
	}

	/** */
	async _updateObject(event, formData) {
		const data = expandObject(formData);
		const newClasses = data?.newClasses;
		const newOrigins = data?.newOrigins;
		const newTrails = data?.newTrails;

		console.log(newClasses);

		// Convert the string of new classes to Array and to Object.
		game.settings.set("ordemparanormal", "newClasses", newClasses);
		game.settings.set("ordemparanormal", "newOrigins", newOrigins);
		game.settings.set("ordemparanormal", "newTrails", newTrails);

		console.log(data);
	}

	/** */
	activateListeners(html) {
		super.activateListeners(html);

		// $('.additionalContent > input').selectize({
		// 	plugins: ['restore_on_backspace', 'clear_button'],
		// 	create: true,
		// 	delimiter: ' - ',
		// 	persist: false,
		// 	maxItems: null,
		// 	valueField: 'email',
		// 	labelField: 'name',
		// 	searchField: ['name', 'email'],
		// 	options: [
		// 		{ email: 'selectize@risadams.com', name: 'Ris Adams' },
		// 		{ email: 'someone@gmail.com', name: 'Someone' },
		// 		{ email: 'someone-else@yahoo.com', name: game.i18n.localize('op.PV') },
		// 	],
		// });
	}
}
