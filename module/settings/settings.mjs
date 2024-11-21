
/**
 * Register all of the system's settings.
 */
export default function registerSystemSettings() {
	/*
	 * Create a custom config setting
	 */
	// game.settings.register('ordemparanormal', 'mySettingName', {
	// 	name: 'My Setting',
	// 	hint: 'A description of the registered setting and its behavior.',
	// 	scope: 'world',     // "world" = sync to db, "client" = local storage
	// 	config: true,       // false if you dont want it to show in module config
	// 	type: Number,       // Number, Boolean, String, Object
	// 	default: 0,
	// 	onChange: value => { // value is the new value of the setting
	// 		console.log(value);
	// 	},
	// });

	// Internal System Migration Version
	game.settings.register('ordemparanormal', 'systemMigrationVersion', {
		name: 'System Migration Version',
		scope: 'world',
		config: false,
		type: String,
		default: ''
	});

	game.settings.register('ordemparanormal', 'patchNotes', {
		name: 'SETTINGS.opPatchNotes',
		hint: 'SETTINGS.opPatchNotesHint',
		scope: 'client',     // "world" = sync to db, "client" = local storage
		config: true,       // false if you dont want it to show in module config
		type: Boolean,       // Number, Boolean, String, Object
		default: false,
		onChange: value => { // value is the new value of the setting
			console.log(value);
		},
	});

	game.settings.register('ordemparanormal', 'globalProgressRules', {
		name: 'SETTINGS.globalProgressRules',
		hint: 'SETTINGS.globalProgressRulesHint',
		scope: 'world',     // "world" = sync to db, "client" = local storage
		config: true,       // false if you dont want it to show in module config
		type: Number,       // Number, Boolean, String, Object
		default: 1,
		onChange: value => { // value is the new value of the setting
			console.log(value);
		},
		requiresReload: true, // true if you want to prompt the user to reload
		choices: {
			1: 'SETTINGS.nexProgressRule',
			2: 'SETTINGS.nexExpProgressRule',
			// 3: 'SETTINGS.patentesProgressRule'
		}
	});

	game.settings.register('ordemparanormal', 'globalPlayingWithoutSanity', {
		name: 'SETTINGS.globalPlayingWithoutSanity',
		hint: 'SETTINGS.globalPlayingWithoutSanityHint',
		scope: 'world',     // "world" = sync to db, "client" = local storage
		config: true,       // false if you dont want it to show in module config
		type: Boolean,       // Number, Boolean, String, Object
		default: false,
		requiresReload: true, // true if you want to prompt the user to reload
		onChange: value => { // value is the new value of the setting
			console.log(value);
		},
	});
}