/* eslint-disable no-extend-native */
/**
 * Minimal Foundry VTT global stubs for unit testing.
 * Runs before every test file via vitest setupFiles.
 * Only stubs the surface needed by the code under test.
 */

// --- Array.prototype.findSplice (Foundry polyfill used by D20Die) ---
if (!Array.prototype.findSplice) {
	Array.prototype.findSplice = function (fn) {
		const i = this.findIndex(fn);
		if (i !== -1) return this.splice(i, 1)[0];
		return undefined;
	};
}

// --- foundry.dice.terms.Die mock ---
class MockDie {
	constructor({ number = 1, faces = 20, modifiers, options, ...rest } = {}) {
		this.number = number;
		this.faces = faces;
		this.modifiers = modifiers ? [...modifiers] : [];
		this.options = options ? { ...options } : {};
		this._evaluated = false;
		this.results = [];
	}

	get total() {
		if (!this._evaluated) return undefined;
		return this.results.reduce((sum, r) => sum + r.result, 0);
	}

	get isValid() {
		return this.faces === 20;
	}
}

class MockNumericTerm {
	constructor({ number, options } = {}) {
		this.number = number;
		this.options = options || {};
	}
}

class MockOperatorTerm {
	constructor({ operator } = {}) {
		this.operator = operator;
	}
}

// --- KeyboardManager mock (used by utils.mjs / areKeysPressed) ---
const MockKeyboardManager = {
	MODIFIER_CODES: { Alt: ["Alt"], Control: ["Control", "MetaLeft", "MetaRight"], Shift: ["Shift"] },
	MODIFIER_KEYS: { ALT: "Alt", CONTROL: "Control", SHIFT: "Shift" },
};
globalThis.KeyboardManager = MockKeyboardManager;

// --- foundry namespace ---
globalThis.foundry = {
	dice: {
		terms: {
			Die: MockDie,
			DiceTerm: MockDie,
			NumericTerm: MockNumericTerm,
			OperatorTerm: MockOperatorTerm,
		},
	},
	utils: {
		deepClone: (v) => JSON.parse(JSON.stringify(v)),
		setProperty: (obj, key, val) => {
			const parts = key.split(".");
			let current = obj;
			for (let i = 0; i < parts.length - 1; i++) {
				if (!(parts[i] in current)) current[parts[i]] = {};
				current = current[parts[i]];
			}
			current[parts[parts.length - 1]] = val;
			return true;
		},
		getProperty: (obj, key) => {
			return key.split(".").reduce((o, k) => o?.[k], obj);
		},
		getType: (v) => {
			if (v === null) return "null";
			if (v === undefined) return "undefined";
			if (Array.isArray(v)) return "Array";
			return typeof v === "object" ? "Object" : typeof v;
		},
		mergeObject: (original, other = {}, options = {}) => {
			if (!other) return original;
			for (const [k, v] of Object.entries(other)) {
				original[k] = v;
			}
			return original;
		},
		isEmpty: (v) => {
			if (v === null || v === undefined) return true;
			if (typeof v === "object") return Object.keys(v).length === 0;
			return !v;
		},
		expandObject: (obj) => {
			const result = {};
			for (const [key, value] of Object.entries(obj)) {
				const parts = key.split(".");
				let current = result;
				for (let i = 0; i < parts.length - 1; i++) {
					if (!(parts[i] in current)) current[parts[i]] = {};
					current = current[parts[i]];
				}
				current[parts[parts.length - 1]] = value;
			}
			return result;
		},
		isNewerVersion: (v1, v2) => {
			const a = v1.split(".").map(Number);
			const b = v2.split(".").map(Number);
			for (let i = 0; i < 3; i++) {
				if ((a[i] || 0) > (b[i] || 0)) return true;
				if ((a[i] || 0) < (b[i] || 0)) return false;
			}
			return false;
		},
	},
	abstract: {
		TypeDataModel: class TypeDataModel {
			constructor(data = {}, options = {}) {
				Object.assign(this, data);
				this.parent = options.parent || null;
			}
			prepareBaseData() {}
			prepareDerivedData() {}
			static defineSchema() {
				return {};
			}
			static migrateData(data) {
				return data;
			}
		},
	},
	data: {
		fields: {
			SchemaField: class SchemaField {
				constructor(fields) {
					this.fields = fields;
				}
			},
			StringField: class StringField {
				constructor(opts = {}) {
					this.initial = opts.initial ?? "";
				}
			},
			NumberField: class NumberField {
				constructor(opts = {}) {
					this.initial = opts.initial ?? 0;
				}
			},
			BooleanField: class BooleanField {
				constructor(opts = {}) {
					this.initial = opts.initial ?? false;
				}
			},
			HTMLField: class HTMLField {
				constructor(opts = {}) {
					this.initial = opts.initial ?? "";
				}
			},
			ArrayField: class ArrayField {
				constructor(element, opts = {}) {
					this.element = element;
					this.initial = opts.initial ?? [];
				}
			},
			ObjectField: class ObjectField {
				constructor(opts = {}) {
					this.initial = opts.initial ?? {};
				}
			},
		},
	},
	applications: {
		api: {
			ApplicationV2: class ApplicationV2 {},
			HandlebarsApplicationMixin: (Base) => Base,
			DialogV2: class DialogV2 {},
		},
		sheets: {
			ActorSheetV2: class ActorSheetV2 {},
			ItemSheetV2: class ItemSheetV2 {},
		},
		handlebars: {
			renderTemplate: async (path) => "",
		},
		ux: {
			TextEditor: {
				implementation: {
					enrichHTML: async (content) => content,
				},
			},
			ContextMenu: { implementation: class ContextMenu {} },
		},
	},
};

// --- CONFIG ---
globalThis.CONFIG = {
	Dice: {
		D20Die: MockDie,
		D20Roll: {
			ADV_MODE: { NORMAL: 0, ADVANTAGE: 1, DISADVANTAGE: -1 },
		},
		BasicRoll: null, // will be set after import
		rolls: [],
	},
	op: {
		skills: {
			acrobatics: "op.skill.acrobatics",
			animal: "op.skill.animal",
			arts: "op.skill.arts",
			athleticism: "op.skill.athleticism",
			relevance: "op.skill.relevance",
			sciences: "op.skill.sciences",
			crime: "op.skill.crime",
			diplomacy: "op.skill.diplomacy",
			deception: "op.skill.deception",
			resilience: "op.skill.resilience",
			stealth: "op.skill.stealth",
			initiative: "op.skill.initiative",
			intimidation: "op.skill.intimidation",
			intuition: "op.skill.intuition",
			investigation: "op.skill.investigation",
			fighting: "op.skill.fighting",
			medicine: "op.skill.medicine",
			occultism: "op.skill.occultism",
			perception: "op.skill.perception",
			driving: "op.skill.driving",
			aim: "op.skill.aim",
			reflexes: "op.skill.reflexes",
			religion: "op.skill.religion",
			survival: "op.skill.survival",
			tactics: "op.skill.tactics",
			technology: "op.skill.technology",
			will: "op.skill.will",
			freeSkill: "op.skill.freeSkill",
		},
	},
	ActiveEffect: { legacyTransferral: false },
	Actor: { documentClass: null, dataModels: {} },
	Item: { documentClass: null, dataModels: {} },
	ChatMessage: { documentClass: null },
	Combat: { initiative: {} },
	time: { roundTime: 6 },
	sounds: { dice: "sounds/dice.wav" },
	fontDefinitions: {},
	statusEffects: [],
	debug: { hooks: false },
};

// --- Roll stub ---
globalThis.Roll = class Roll {
	constructor(formula, data, options) {
		this.formula = formula;
		this.data = data || {};
		this.options = options || {};
		this.terms = [];
		this._evaluated = false;
		this.total = 0;
	}

	static replaceFormulaData(formula, data) {
		if (!formula) return formula;
		return String(formula).replace(/@([a-zA-Z0-9_.]+)/g, (match, key) => {
			const val = foundry.utils.getProperty(data, key);
			return val !== undefined ? String(val) : match;
		});
	}

	static safeEval(expression) {
		return Number(expression) || 0;
	}

	async evaluate() {
		this._evaluated = true;
		return this;
	}

	resetFormula() {
		// no-op stub — real Foundry rebuilds the formula string from terms
	}

	applyRollMode() {}

	toObject() {
		return { formula: this.formula, data: this.data, options: this.options };
	}

	async toMessage() {
		return {};
	}
};

// --- Base document classes ---
globalThis.Actor = class Actor {
	constructor(data = {}, context = {}) {
		this.system = data.system || {};
		this.items = data.items || [];
		this.name = data.name || "";
		this.type = data.type || "";
		this.flags = data.flags || {};
	}
	prepareData() {}
	prepareBaseData() {}
	prepareDerivedData() {}
	getRollData() {
		return { ...this.system };
	}
	applyActiveEffects() {}
	allApplicableEffects() {
		return [];
	}
};

globalThis.Item = class Item {
	constructor(data = {}, context = {}) {
		this.system = data.system || {};
		this.actor = context.parent || null;
		this.name = data.name || "";
		this.type = data.type || "";
	}
	prepareData() {}
	getRollData() {
		return {};
	}
};

globalThis.ChatMessage = class ChatMessage {
	static getSpeaker() {
		return {};
	}
	static getWhisperRecipients() {
		return [];
	}
	static create() {
		return {};
	}
};

// --- Hooks ---
globalThis.Hooks = {
	_hooks: {},
	on(name, fn) {
		this._hooks[name] = this._hooks[name] || [];
		this._hooks[name].push(fn);
		return this._hooks[name].length;
	},
	once(name, fn) {
		return this.on(name, fn);
	},
	off(name, id) {},
	call(name, ...args) {
		return true;
	},
	callAll(name, ...args) {
		return true;
	},
};

// --- game ---
globalThis.game = {
	user: { isGM: true, id: "mock-user", name: "MockUser" },
	settings: {
		get: (module, key) => {
			if (key === "globalProgressRules") return 1;
			if (key === "globalPlayingWithoutSanity") return false;
			if (key === "systemMigrationVersion") return "7.3.3";
			return undefined;
		},
		set: async () => {},
		register: () => {},
	},
	i18n: {
		localize: (key) => key,
		format: (key, data) => key,
		has: () => true,
	},
	keybindings: { register: () => {} },
	system: { version: "7.3.3", flags: {}, title: "Ordem Paranormal" },
	modules: { get: () => null },
	version: "13.351",
	actors: { size: 0 },
	scenes: { size: 0 },
	items: { size: 0 },
	users: { filter: () => [] },
	world: { flags: {} },
};

// --- UI stubs ---
globalThis.ui = {
	notifications: {
		info: () => {},
		warn: () => {},
		error: () => {},
	},
};

// --- CONST ---
globalThis.CONST = {
	TOKEN_DISPLAY_MODES: {
		NONE: 0,
		HOVER: 20,
		ALWAYS: 30,
		OWNER: 40,
		OWNER_HOVER: 10,
	},
	TOKEN_DISPOSITIONS: { HOSTILE: -1, NEUTRAL: 0, FRIENDLY: 1 },
	ACTIVE_EFFECT_MODES: {
		CUSTOM: 0,
		MULTIPLY: 1,
		ADD: 2,
		DOWNGRADE: 3,
		UPGRADE: 4,
		OVERRIDE: 5,
	},
	DICE_ROLL_MODES: {
		PUBLIC: "publicroll",
		PRIVATE: "gmroll",
		BLIND: "blindroll",
		SELF: "selfroll",
	},
};

// --- Handlebars ---
globalThis.Handlebars = {
	registerHelper: () => {},
	SafeString: class SafeString {
		constructor(s) {
			this.string = s;
		}
		toString() {
			return this.string;
		}
	},
};

// --- Number polyfills used by Foundry ---
if (!Number.isNumeric) {
	Number.isNumeric = function (n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	};
}

// --- Math.clamp ---
if (!Math.clamp) {
	Math.clamp = function (value, min, max) {
		return Math.min(Math.max(value, min), max);
	};
}

// --- Number.prototype.toNearest ---
if (!Number.prototype.toNearest) {
	Number.prototype.toNearest = function (interval = 1) {
		return Math.round(this / interval) * interval;
	};
}

// --- Misc globals ---
globalThis.getDocumentClass = (name) => {
	if (name === "ChatMessage") return ChatMessage;
	return class {};
};

globalThis.fromUuid = async () => null;
globalThis.renderTemplate = async () => "";
if (!globalThis.navigator) {
	try {
		globalThis.navigator = { onLine: false };
	} catch (_) {
		// navigator is a read-only getter in some environments; skip
	}
}
