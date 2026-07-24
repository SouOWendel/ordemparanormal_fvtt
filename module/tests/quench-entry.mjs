/**
 * Quench integration test entry point.
 * Loaded only when the Quench module is active (see ordemparanormal.mjs ready hook).
 * Each suite file registers its own batch via Hooks.once("quenchReady", ...).
 */
import "./suites/actor-agent.test.mjs";
import "./suites/actor-agent-extended.test.mjs";
import "./suites/actor-threat.test.mjs";
import "./suites/actor-threat-extended.test.mjs";
import "./suites/threat-persistence.test.mjs";
import "./suites/actor-rolls.test.mjs";
import "./suites/actor-spaces-rolldata.test.mjs";
import "./suites/item-rolls.test.mjs";
import "./suites/item-damage-rolls.test.mjs";
import "./suites/item-attack-flow.test.mjs";
import "./suites/threat-attacks.test.mjs";
import "./suites/chat-commands.test.mjs";
import "./suites/active-effects.test.mjs";
import "./suites/migrations.test.mjs";
import "./suites/sheets.test.mjs";
import "./suites/reactions.test.mjs";
import "./suites/combat-qol-coverage.test.mjs";
import "./suites/agent-skill-defaults.test.mjs";
import "./suites/conditions.test.mjs";
import "./suites/massive-damage.test.mjs";
