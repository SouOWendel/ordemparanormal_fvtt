/**
 * The Paranormal Order game system for Foundry Virtual Tabletop
 * Author: SouOWendel
 * Software License: CC BY-NC-SA 4.0
 * Repository: https://github.com/SouOWendel/ordemparanormal_fvtt
 * Issue Tracker: https://github.com/SouOWendel/ordemparanormal_fvtt/issues
 */

/* eslint-disable no-undef */
// Import document classes.
import { OrdemActor } from "./documents/actor.mjs";
import { OrdemItem } from "./documents/item.mjs";
// Import sheet classes.
import { OrdemActorSheet } from "./sheets/actor-sheet.mjs";
import { OrdemItemSheet } from "./sheets/item-sheet.mjs";
import { OrdemThreatSheet } from "./sheets/threat-sheet.mjs";

import { op } from "./helpers/config.mjs";
import displayMessages from "./components/message-system.mjs";
import registerSystemSettings from "./settings/settings.mjs";
import { registerSystemKeybindings } from "./settings/settings.mjs";

import * as dataModels from "./data/_module.mjs";
import * as documents from "./documents/_partial_module.mjs";
import * as dice from "./dice/_module.mjs";
import * as migrations from "./migrations.mjs";
import * as hooks from "./hooks.mjs";

import * as utils from "./utils.mjs";

// import { rescueAllPathEffects } from '../utils/__test__/effects.mjs';

globalThis.ordemparanormal = {
	documents,
	dice,
};

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once("init", function () {
	// Add utility classes to the global game object so that they're more easily
	// accessible in global contexts.
	game.ordemparanormal = {
		OrdemActor,
		OrdemItem,
		dice,
	};

	CONFIG.op = op;
	CONFIG.ActiveEffect.legacyTransferral = false;
	// Define custom Document classes
	CONFIG.Actor.documentClass = OrdemActor;
	CONFIG.Item.documentClass = OrdemItem;
	Object.assign(CONFIG.Actor.dataModels, {
		agent: dataModels.AgentData,
		threat: dataModels.ThreatData,
	});
	Object.assign(CONFIG.Item.dataModels, {
		ammunition: dataModels.AmmunitionData,
		armament: dataModels.ArmamentData,
		generalEquipment: dataModels.GeneralEquipmentData,
		protection: dataModels.ProtectionData,
		ability: dataModels.AbilityData,
		ritual: dataModels.RitualData,
	});
	CONFIG.ChatMessage.documentClass = documents.ChatMessageOP;
	CONFIG.time.roundTime = 6; // Pg. 169 of the Book
	CONFIG.Dice.D20Die = dice.D20Die;
	CONFIG.Dice.BasicRoll = dice.BasicRoll;
	CONFIG.Dice.D20Roll = dice.D20Roll;

	// Register Roll Extensions
	CONFIG.Dice.rolls = [dice.BasicRoll, dice.D20Roll];

	CONFIG.Combat.initiative = {
		formula: "@rollInitiative",
		decimals: 2,
	};

	// Register sheet application classes
	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("ordemparanormal", OrdemActorSheet, {
		types: ["agent"],
		makeDefault: true,
	});
	Actors.registerSheet("ordemparanormal", OrdemThreatSheet, {
		types: ["threat"],
		makeDefault: true,
	});

	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("ordemparanormal", OrdemItemSheet, {
		makeDefault: true,
	});
	// Configure Fonts
	_configureFonts();

	// Register System Settings in Other File
	registerSystemSettings();
	utils.preloadHandlebarsTemplates();

	// Change the logo of Foundry for Ordem Paranormal logo.
	if (navigator.onLine) {
		const logo = document.querySelector("#logo");
		if (logo) logo.src = "https://i.imgur.com/TTrDGM4.png";
	}
});

Hooks.once("ready", function () {
	// Display welcome messages, reports and release notes.
	displayMessages();

	// Determine whether a system migration is required and feasible
	if (!game.user.isGM) return;
	const cv = game.settings.get("ordemparanormal", "systemMigrationVersion") || game.world.flags.ordemparanormal?.version;
	const totalDocuments = game.actors.size + game.scenes.size + game.items.size;
	if (!cv && totalDocuments === 0)
		return game.settings.set("ordemparanormal", "systemMigrationVersion", game.system.version);
	// When the flag is greater than the current migration version, the migration is perfomed.
	console.log("Verificando a necessidade de migração...");
	console.log(
		cv,
		game.system.flags.needsMigrationVersion,
		!foundry.utils.isNewerVersion(game.system.flags.needsMigrationVersion, cv)
	);
	if (cv && !foundry.utils.isNewerVersion(game.system.flags.needsMigrationVersion, cv)) {
		console.log("Migração não é necessária.");
		return;
	}
	console.log("Iniciando a migração de dados!");

	// Determine whether a system migration is required and feasible
	migrations.migrateWorld();
});

/**
 * Configure additional system fonts.
 */
function _configureFonts() {
	Object.assign(CONFIG.fontDefinitions, {
		"Warnock Pro": {
			editor: true,
			fonts: [
				{
					urls: ["systems/ordemparanormal/media/fonts/warnock-pro/WarnockPro-Regular.otf"],
				},
				{
					urls: ["systems/ordemparanormal/media/fonts/warnock-pro/WarnockPro-Semibold.otf"],
					weight: "bold",
				},
				{
					urls: ["systems/ordemparanormal/media/fonts/warnock-pro/WarnockPro-SemiboldItSubh.otf"],
					style: "italic",
				},
				{
					urls: ["systems/ordemparanormal/media/fonts/warnock-pro/WarnockPro-SemiboldIt.otf"],
					weight: "bold",
					style: "italic",
				},
			],
		},
		"Optima Nova LT PRO": {
			editor: true,
			fonts: [
				{
					urls: ["systems/ordemparanormal/media/fonts/optima-nova-lt-pro/OptimaNovaLTProRegular.otf"],
				},
				{
					urls: ["systems/ordemparanormal/media/fonts/optima-nova-lt-pro/OptimaNovaLTProBold.otf"],
					weight: "bold",
				},
				{
					urls: ["systems/ordemparanormal/media/fonts/optima-nova-lt-pro/OptimaNovaLTProItalic.otf"],
					style: "italic",
				},
				{
					urls: ["systems/ordemparanormal/media/fonts/optima-nova-lt-pro/OptimaNovaLTProBoldItalic.otf"],
					weight: "bold",
					style: "italic",
				},
			],
		},
	});
}

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper("concat", function () {
	let outStr = "";
	for (const arg in arguments) {
		if (typeof arguments[arg] != "object") {
			outStr += arguments[arg];
		}
	}
	return outStr;
});

Handlebars.registerHelper("concatObjAndStr", function () {
	const args = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
	let objects = {};
	for (const arg in args) {
		if (typeof arguments[arg] == "object" || typeof arguments[arg] == "string") {
			if (arg == 0) {
				objects = arguments[arg];
			} else {
				objects = objects[arguments[arg]];
			}
		}
	}
	return objects;
});

Handlebars.registerHelper("numberInputFVTT", function (value, options) {
	const properties = [];
	for (const k of ["class", "name", "placeholder", "min", "max"]) {
		if (k in options.hash) properties.push(`${k}="${options.hash[k]}"`);
	}
	const step = options.hash.step ?? "any";
	properties.unshift(`step="${step}"`);

	// Disabled = True or False
	if (options.hash.disabled === true) properties.push("disabled");

	let safe = Number.isNumeric(value) ? Number(value) : "";
	if (Number.isNumeric(step) && typeof safe === "number") {
		safe = safe.toNearest(Number(step));
	}
	return new Handlebars.SafeString(`<input type="number" value="${safe}" ${properties.join(" ")}>`);
});

Handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
	// eslint-disable-next-line no-invalid-this
	return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper("ifInequals", function (arg1, arg2, options) {
	// eslint-disable-next-line no-invalid-this
	return arg1 != arg2 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper("abilityTypeHelper", function (arg) {
	if (arg == 1) return "origin";
	else if (arg == 2) return "class";
	else if (arg == 3) return "path";
	else if (arg == 4) return "paranormal";
	else if (arg == 5) return "ability";
});

Handlebars.registerHelper("inputValid", function (arg1, arg2) {
	return arg1 != arg2 && "disabled";
});

Handlebars.registerHelper("toLowerCase", function (str) {
	return str.toLowerCase();
});

Handlebars.registerHelper("toUpperCase", function (str) {
	return str.toUpperCase();
});

Handlebars.registerHelper("ternary", function (condition, trueValue, falseValue) {
	return condition ? trueValue : falseValue;
});

/**
 * Optional `name="value"` for optional data attributes (e.g. data-token-id on chat cards).
 * @returns {Handlebars.SafeString} Empty when value is null/empty.
 */
Handlebars.registerHelper("opOptionalDataAttr", function (name, value) {
	if (value == null || value === "") {
		return new Handlebars.SafeString("");
	}
	return new Handlebars.SafeString(` ${name}="${String(value)}"`);
});

/**
 * `data-disabled` or `data-duration.rounds` for the "create effect" control by section type.
 * Used in `actor-effects`, `shared/effects`, and `threat-effects` templates.
 */
Handlebars.registerHelper("opActiveEffectCreateAttrs", function (section) {
	const t = section?.type;
	if (t === "inactive") {
		return new Handlebars.SafeString(' data-disabled="true"');
	}
	if (t === "temporary") {
		return new Handlebars.SafeString(' data-duration.rounds="1"');
	}
	return new Handlebars.SafeString("");
});

/**
 * Custom radioBoxes helper that properly handles numeric values
 * @param {string} name - The name attribute for the radio inputs
 * @param {Object} choices - Object with key-value pairs for the radio options
 * @param {Object} options - Handlebars options object containing hash parameters
 * @returns {Handlebars.SafeString} HTML string of radio inputs
 */
Handlebars.registerHelper("radioBoxes", function (name, choices, options) {
	const hash = options.hash || {};
	const checked = hash.checked;

	let html = "";
	for (const [key, label] of Object.entries(choices)) {
		// Compare both as strings and as their original types to handle number/string mismatches
		const isChecked = checked == key || String(checked) === String(key);
		const checkedAttr = isChecked ? "checked" : "";

		html += `<label class="radio-label">
			<input type="radio" name="${name}" value="${key}" ${checkedAttr}>
			<span>${label}</span>
		</label>`;
	}

	return new Handlebars.SafeString(html);
});

/* -------------------------------------------- */
/*  Ready Hooks                                  */
/* -------------------------------------------- */

// Hook for create a macro on drop items or effects in hotbar.
Hooks.once("ready", function () {
	// Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
	Hooks.on("hotbarDrop", (bar, data, slot) => {
		if (["Item", "ActiveEffect"].includes(data.type)) {
			documents.macro.createOPMacro(data, slot);
			return false;
		}
	});
});

Hooks.on("renderChatLog", (app, html, data) => OrdemItem.chatListeners(html));
Hooks.on("renderChatPopout", (app, html, data) => OrdemItem.chatListeners(html));

// Load Quench integration tests only in dev environments where Quench is active
// Must run in "init" so the files are imported before "quenchReady" fires in "ready"
Hooks.once("init", () => {
	if (game.modules.get("quench")?.active) {
		import("./tests/quench-entry.mjs");
	}
});
// Hooks.on('renderChatMessage', (app, html, data) => OrdemItem.chatListeners(html));

/* -------------------------------------------- */

// Load hooks
hooks.default();
