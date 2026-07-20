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
import { OrdemCombat } from "./documents/combat.mjs";
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
import { handleReaction } from "./helpers/reactions.mjs";

// import { rescueAllPathEffects } from '../utils/__test__/effects.mjs';

globalThis.ordemparanormal = {
	documents,
	dice,
};

const collections = foundry.documents.collections;
const sheets = foundry.appv1.sheets;

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
		// ammunition: dataModels.AmmunitionData,
		armament: dataModels.ArmamentData,
		generalEquipment: dataModels.GeneralEquipmentData,
		protection: dataModels.ProtectionData,
		ability: dataModels.AbilityData,
		ritual: dataModels.RitualData,
		origin: dataModels.OriginData,
		path: dataModels.PathData,
		class: dataModels.ClassData,
	});
	CONFIG.ChatMessage.documentClass = documents.ChatMessageOP;
	CONFIG.time.roundTime = 6; // Pg. 169 of the Book
	CONFIG.Dice.D20Die = dice.D20Die;
	CONFIG.Dice.BasicRoll = dice.BasicRoll;
	CONFIG.Dice.D20Roll = dice.D20Roll;

	// Register Roll Extensions
	CONFIG.Dice.rolls = [dice.BasicRoll, dice.D20Roll];

	CONFIG.Combat.documentClass = OrdemCombat;
	CONFIG.Combat.initiative = {
		formula: "@rollInitiative",
		decimals: 2,
	};

	// Register sheet application classes
	collections.Actors.unregisterSheet("core", sheets.ActorSheet);
	collections.Actors.registerSheet("ordemparanormal", OrdemActorSheet, {
		types: ["agent"],
		makeDefault: true,
	});
	collections.Actors.registerSheet("ordemparanormal", OrdemThreatSheet, {
		types: ["threat"],
		makeDefault: true,
	});

	collections.Items.unregisterSheet("core", sheets.ItemSheet);
	collections.Items.registerSheet("ordemparanormal", OrdemItemSheet, {
		makeDefault: true,
	});
	// Configure Fonts
	_configureFonts();

	// Register System Settings in Other File
	registerSystemSettings();
	utils.preloadHandlebarsTemplates();

	// Change the logo of Foundry for Ordem Paranormal logo.
	if (navigator.onLine) document.querySelector("#logo")?.setAttribute("src", "https://i.imgur.com/TTrDGM4.png");
});

Hooks.once("setup", function () {
	registerSystemKeybindings();
});

Hooks.once("ready", function () {
	// Display welcome messages, reports and release notes.
	displayMessages();

	// GM-authoritative socket handler — only the first active GM processes requests
	/**
	 * GM-side aggregation of an opposed-test result. Idempotent: re-entering with
	 * the same participant just replaces their previous total. Ends the test
	 * (sets `resolved` and posts a ranked card) once every active player has
	 * rolled (or immediately when there are zero non-GM participants and the
	 * GM is rolling solo).
	 *
	 * Extracted from the socket handler so the GM client itself can call it
	 * directly — `game.socket.emit` does not loopback to the sender, so a
	 * GM-only world or a GM rolling alone would never aggregate results.
	 */
	async function handleOpostoResult(data) {
		const msg = game.messages.get(data.messageId);
		if (!msg) return;
		if (msg.getFlag("ordemparanormal", "resolved")) return;

		const previous = msg.getFlag("ordemparanormal", "results") ?? [];
		const dedupeKey = data.actorId ?? data.userId ?? data.actorName;
		const filtered = previous.filter((r) => (r.actorId ?? r.userId ?? r.actorName) !== dedupeKey);
		filtered.push({
			actorName: data.actorName,
			actorId: data.actorId,
			userId: data.userId,
			total: data.total,
		});
		await msg.setFlag("ordemparanormal", "results", filtered);

		// Resolve when every active non-GM player has rolled. A GM rolling solo
		// (zero non-GM participants) resolves on the first push.
		const activePlayers = game.users.filter((u) => !u.isGM && u.active).length;
		if (filtered.length >= activePlayers) {
			await msg.setFlag("ordemparanormal", "resolved", true);
			const content = await foundry.applications.handlebars.renderTemplate(
				"systems/ordemparanormal/templates/chat/oposto-results.hbs",
				{
					skillLabel: game.i18n.localize(CONFIG.op.skills[data.skillKey]),
					results: filtered
						.sort((a, b) => b.total - a.total)
						.map((r, i) => ({
							...r,
							rank: i + 1,
							winnerClass: i === 0 ? "winner" : "",
							winnerIcon: i === 0 ? " 🥇" : "",
						})),
				}
			);
			await ChatMessage.create({ speaker: ChatMessage.getSpeaker(), content });
		}
	}

	// Expose on the system module API so the click handler can aggregate
	// locally on the GM client (`game.socket.emit` doesn't loopback to the
	// sender). System-scoped instead of `globalThis` to keep the surface clean
	// and survive hot reloads without leaking duplicates.
	const systemModule = game.system;
	if (systemModule) {
		systemModule.api ??= {};
		systemModule.api.handleOpostoResult = handleOpostoResult;
	}

	game.socket.on("system.ordemparanormal", async (data) => {
		const firstGM = game.users.find((u) => u.isGM && u.active);
		if (!firstGM || firstGM.id !== game.user.id) return;

		if (data.type === "applyDamage") {
			const sender = data.userId ? game.users.get(data.userId) : null;
			const actor = await fromUuid(data.actorUuid);
			if (!sender || !actor) return;
			const senderAllowed = sender.isGM || actor.testUserPermission?.(sender, "OWNER");
			if (!senderAllowed) return;
			if (actor.isOwner) await actor.applyDamage(data.amount, data.options);
		}

		if (data.type === "opostoResult") {
			if (!utils.isOpostoSenderAuthorized(data)) return;
			await handleOpostoResult(data);
		}

		if (data.type === "reaction") {
			const sender = data.userId ? game.users.get(data.userId) : null;
			if (!sender) return;
			await handleReaction({ sender, payload: data.payload });
		}
	});

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
		"Libre Baskerville": {
			editor: true,
			fonts: [
				{
					urls: ["systems/ordemparanormal/media/fonts/libre-baskerville/LibreBaskerville-Regular.ttf"],
				},
				{
					urls: ["systems/ordemparanormal/media/fonts/libre-baskerville/LibreBaskerville-Bold.ttf"],
					weight: "bold",
				},
				{
					urls: ["systems/ordemparanormal/media/fonts/libre-baskerville/LibreBaskerville-Italic.ttf"],
					style: "italic",
				},
				{
					urls: ["systems/ordemparanormal/media/fonts/libre-baskerville/LibreBaskerville-BoldItalic.ttf"],
					weight: "bold",
					style: "italic",
				},
			],
		},
		"Source Sans 3": {
			editor: true,
			fonts: [
				{
					urls: ["systems/ordemparanormal/media/fonts/source-sans-3/SourceSans3-Regular.ttf"],
				},
				{
					urls: ["systems/ordemparanormal/media/fonts/source-sans-3/SourceSans3-Bold.ttf"],
					weight: "bold",
				},
				{
					urls: ["systems/ordemparanormal/media/fonts/source-sans-3/SourceSans3-Italic.ttf"],
					style: "italic",
				},
				{
					urls: ["systems/ordemparanormal/media/fonts/source-sans-3/SourceSans3-BoldItalic.ttf"],
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
	// SYNC HANDLER REQUIRED. Foundry dispatches `hotbarDrop` via Hooks.call;
	// returning `=== false` cancels the default macro creation. Keep this
	// listener synchronous — wrapping in `async` would silently break the
	// suppression because a Promise return is truthy from Foundry's POV.
	Hooks.on("hotbarDrop", (bar, data, slot) => {
		if (["Item", "ActiveEffect"].includes(data.type)) {
			documents.macro.createOPMacro(data, slot);
			return false;
		}
	});
});

/**
 * Click handler for /dt and /oposto chat command cards.
 * Attached once per chat container by `attachChatCommandListenerOnce` below.
 * Actor resolution lives in `utils.resolveChatCommandActor` so it can be
 * unit-tested without booting Foundry.
 */
async function handleChatCommandClick(event) {
	const dtButton = event.target.closest("[data-action='rollDT']");
	if (dtButton) {
		const skill = dtButton.dataset.skill;
		const target = parseInt(dtButton.dataset.target);
		const actor = utils.resolveChatCommandActor();
		if (!actor) return ui.notifications.warn(game.i18n.localize("op.noActorSelected"));
		actor.rollSkill({ skill, rolls: [{ options: { target } }] });
		return;
	}

	const opostoButton = event.target.closest("[data-action='rollOposto']");
	if (opostoButton) {
		const skill = opostoButton.dataset.skill;
		const messageId = opostoButton.closest(".message")?.dataset.messageId;
		const actor = utils.resolveChatCommandActor();
		if (!actor) return ui.notifications.warn(game.i18n.localize("op.noActorSelected"));

		const rolls = await actor.rollSkill({ skill }, { configure: false });
		const roll = Array.isArray(rolls) ? rolls[0] : rolls;
		if (!roll) return;

		const payload = {
			type: "opostoResult",
			messageId,
			actorName: actor.name,
			actorId: actor.id,
			skillKey: skill,
			total: roll.total,
			userId: game.user.id,
		};
		game.socket.emit("system.ordemparanormal", payload);
		// `socket.emit` doesn't loopback — when the GM is the one clicking, also
		// run the aggregator locally so the results card actually gets posted.
		const aggregateLocally = game.system?.api?.handleOpostoResult;
		if (game.user.isGM && typeof aggregateLocally === "function") {
			await aggregateLocally(payload);
		}

		ui.notifications.info(game.i18n.format("op.opostoRolled", { actor: actor.name, total: roll.total }));
	}
}

// Chat command card buttons (`/dt`, `/oposto`) can render in multiple
// containers depending on Foundry v13.x's chat layout: the sidebar tab
// `#chat`, the popup toast notifications under `#chat-notifications`, or a
// detached chat popout. Using `document.body` as the delegation root covers
// every layout without racing the sidebar boot sequence — bubbled clicks from
// any container reach body unchanged.
//
// The marker is a property on the host element itself (not a module-scoped
// WeakSet) so a dev hot-reload that re-evaluates this file still sees the
// existing flag and does NOT register a second listener. Without this guard,
// hot reload N times means N listener invocations per click.
const CHAT_CMD_MARKER = "_ordemparanormalChatCmdListener";
function attachChatCommandListenerOnce(host) {
	if (!host || host[CHAT_CMD_MARKER]) return;
	host[CHAT_CMD_MARKER] = handleChatCommandClick;
	host.addEventListener("click", handleChatCommandClick);
}

// `OrdemItem.chatListeners` uses scoped delegation on the chat log itself, so
// keep its hook wiring intact — only the command-card listener moves to body.
Hooks.on("renderChatLog", (_app, html) => OrdemItem.chatListeners(html));
Hooks.on("renderChatPopout", (_app, html) => OrdemItem.chatListeners(html));

// Single global listener — body is always present and survives re-renders.
attachChatCommandListenerOnce(document.body);

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
