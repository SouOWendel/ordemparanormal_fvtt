import chatCommands from "./chat/chat-commands.mjs";
import { shouldShowCombatantHP } from "./helpers/visibility.mjs";

// Module-level barrier for async effect expirations.
//
// Foundry dispatches `combatTurn`/`combatRound` via `Hooks.callAll`, which
// fires async listeners without awaiting them. Tests that await
// `combat.nextTurn()` and then assert that an expired effect is gone observe
// flakes because the listener's `deleteEmbeddedDocuments` is still in flight.
// We hoist a shared Promise that chains every expiration run; tests can
// `await getPendingExpirations()` for a deterministic barrier instead of
// `setTimeout(800)`.
let _expirationsPromise = Promise.resolve();

/**
 * Resolve once every pending temporary-effect expiration triggered so far has
 * finished its deleteEmbeddedDocuments call. Used by Quench tests to avoid
 * timing-based flakes between `combat.nextTurn()` and the assertion.
 *
 * @returns {Promise<void>}
 */
export function getPendingExpirations() {
	return _expirationsPromise;
}

// Pure expiration runner. Keep ALL the original logic here — the wrapper below
// is just the chain bookkeeping. IMPORTANT (Foundry v13): `combatTurn` and
// `combatRound` disparam ANTES do commit do update — `combat.round` / `combat.turn`
// ainda refletem o estado anterior. O round/turn _alvo_ vem em `updateData`.
// Calcular `roundsLeft` a partir de `combat.round` "atrasa" um turno inteiro
// e o efeito sobrevive até que algum outro update force uma re-checagem (era
// exatamente o sintoma de "só expira ao voltar uma rodada"). Aqui usamos
// `updateData.round ?? combat.round`.
async function _runExpireTemporaryEffects(combat, updateData = {}) {
	if (!game.user.isGM) return;
	const firstGM = game.users.find((u) => u.isGM && u.active);
	if (!firstGM || firstGM.id !== game.user.id) return;

	const nextRound = updateData?.round ?? combat.round;
	const nextTurn = updateData?.turn ?? combat.turn;
	const turnsPerRound = Math.max(1, combat.turns?.length ?? 1);
	// Agrupar deletes por parent para uma única chamada por documento — mais
	// barato e evita disparar múltiplas re-renders no mesmo Actor/Item.
	const byParent = new Map();
	const namesByActor = new Map();

	for (const combatant of combat.combatants ?? []) {
		const actor = combatant.actor;
		if (!actor) continue;

		for (const effect of actor.allApplicableEffects()) {
			if (effect.disabled || !effect.isTemporary) continue;
			const dur = effect.duration;
			if (!dur) continue;

			const roundsLeft =
				dur.startRound != null && dur.rounds != null ? dur.rounds - (nextRound - dur.startRound) : Infinity;
			let roundsElapsed = dur.startRound != null ? nextRound - dur.startRound : 0;
			let turnsElapsed = dur.startTurn != null ? nextTurn - dur.startTurn : 0;
			// Wrap-around: quando a rodada avança, `nextTurn` cai para 0 e pode
			// ficar menor que `dur.startTurn`. Sem ajuste, `turnsElapsed` vira
			// negativo e cancela parte do `roundsElapsed * turnsPerRound`,
			// fazendo o efeito sobreviver 1 turno a mais do que deveria.
			if (turnsElapsed < 0 && roundsElapsed > 0) {
				turnsElapsed += turnsPerRound;
				roundsElapsed -= 1;
			}
			const totalTurns = roundsElapsed * turnsPerRound + turnsElapsed;
			const turnsLeft = dur.turns != null ? dur.turns - totalTurns : Infinity;
			if (roundsLeft > 0 && turnsLeft > 0) continue;

			const parent = effect.parent;
			if (!parent) continue;
			const key = parent.uuid ?? parent.id;
			if (!byParent.has(key)) byParent.set(key, { parent, ids: [] });
			byParent.get(key).ids.push(effect.id);

			if (!namesByActor.has(actor.uuid)) namesByActor.set(actor.uuid, { actor, names: [] });
			namesByActor.get(actor.uuid).names.push(effect.name);
		}
	}

	let didDelete = false;
	for (const { parent, ids } of byParent.values()) {
		try {
			await parent.deleteEmbeddedDocuments("ActiveEffect", ids);
			didDelete = true;
		} catch (err) {
			console.warn("ordemparanormal | falha ao expirar efeitos", err);
		}
	}
	// Force-render the combat tracker as soon as the delete commits. Foundry's
	// own deleteActiveEffect hook re-renders open sheets, but the tracker
	// listens to a different hook and can lag visibly behind. The reviewer
	// reported "efeitos não são removidos" — that's the perceived gap.
	if (didDelete) {
		try {
			ui.combat?.render(false);
		} catch (_e) {
			/* tracker may be closed */
		}
	}
	for (const { actor, names } of namesByActor.values()) {
		for (const name of names) {
			ChatMessage.create({
				content: game.i18n.format("op.effectExpired", { effect: name, actor: actor.name }),
			});
		}
	}
}

// Chain every expiration onto a shared Promise so the latest tail is
// observable via `getPendingExpirations()`. A failing run never breaks the
// chain — we swallow the error on the awaitable side and let the inner
// console.warn surface the diagnostic.
function _expireTemporaryEffects(combat, updateData) {
	const next = _expirationsPromise.then(() => _runExpireTemporaryEffects(combat, updateData));
	_expirationsPromise = next.catch(() => {});
	return next;
}

/** */
export default function () {
	// Register chat commands (/dt, /oposto)
	chatCommands();

	Hooks.on("combatTurn", (combat, updateData) => _expireTemporaryEffects(combat, updateData));
	Hooks.on("combatRound", (combat, updateData) => _expireTemporaryEffects(combat, updateData));
	/**
	 * Criando o Hook preCreateActor para o módulo Bar Brawl adicionar
	 * uma terceira barra nos tokens criados, essa barra ira representar
	 * uns dos atributos bases dos personagens — os pontos de esforço.
	 * Bar Brawl Gitlab: https://gitlab.com/woodentavern/foundryvtt-bar-brawl
	 */
	// SYNC HANDLER REQUIRED. Foundry dispatches `preCreate*` via Hooks.call and
	// aborts creation when any listener returns `=== false`. An async listener
	// returns a Promise (truthy) so a deferred `return false` is ignored —
	// keep this handler synchronous and never wrap it in `async (...)`.
	Hooks.on("preCreateActor", function (actor, data) {
		if (actor.type === "threat") {
			const prototypeToken = { disposition: -1, actorLink: false };
			actor.updateSource({ prototypeToken }); // Set disposition to "Hostile"
			actor.updateSource({
				"prototypeToken.flags.barbrawl.resourceBars": {
					// Espaço entre o token e a barra de PV.
					threatSpaceBar: {
						id: "threatSpaceBar",
						mincolor: "#000000",
						maxcolor: "#FFFFFF",
						position: "bottom-outer",
						value: 1,
						max: 1,
						opacity: 0,
						label: "",
						attribute: "custom",
						style: "fraction",
						ownerVisibility: CONST.TOKEN_DISPLAY_MODES.HOVER,
						otherVisibility: CONST.TOKEN_DISPLAY_MODES.NONE,
						hideHud: true,
					},
					threatHPBar: {
						id: "threatHPBar",
						mincolor: "#ff1a1a",
						maxcolor: "#80ff00",
						position: "bottom-outer",
						attribute: "attributes.hp",
						label: "PV",
						style: "fraction",
						ownerVisibility: CONST.TOKEN_DISPLAY_MODES.HOVER,
						otherVisibility: CONST.TOKEN_DISPLAY_MODES.NONE,
					},
				},
			});
		}

		// TODO: APLICAR UMA CONFIGURAÇÃO DE BAR BRAWL PARA PD E OUTRA PARA PE E SAN.
		// Filtrando por tipos de Actors disponíveis no sistema.
		if (actor.type === "agent") {
			const prototypeToken = { disposition: 1, actorLink: true }; // Set disposition to "Friendly"
			actor.updateSource({ prototypeToken });

			/**
			 * Adicionando configurações para todas as barras.
			 * Criando uma barra extra com o módulo Bar Brawl (configuração para os Pontos de PE)
			 */
			actor.updateSource({
				"prototypeToken.flags.barbrawl.resourceBars": {
					// Espaço entre o token e as barras de PE, PD e SAN.
					agentSpaceBar: {
						id: "agentSpaceBar",
						mincolor: "#000000",
						maxcolor: "#FFFFFF",
						position: "bottom-outer",
						value: 1,
						max: 1,
						opacity: 0,
						label: "",
						attribute: "custom",
						style: "fraction",
						ownerVisibility: CONST.TOKEN_DISPLAY_MODES.HOVER,
						otherVisibility: CONST.TOKEN_DISPLAY_MODES.NONE,
						hideHud: true,
					},
					pv: {
						id: "pv",
						mincolor: "#ff1a1a",
						maxcolor: "#80ff00",
						position: "bottom-outer",
						attribute: "PV",
						label: "PV",
						style: "fraction",
						ownerVisibility: CONST.TOKEN_DISPLAY_MODES.HOVER,
						otherVisibility: CONST.TOKEN_DISPLAY_MODES.NONE,
					},
					pe: {
						id: "pe",
						mincolor: "#242899",
						maxcolor: "#66a8ff",
						position: "bottom-outer",
						attribute: "PE",
						label: "PE",
						style: "fraction",
						ownerVisibility: CONST.TOKEN_DISPLAY_MODES.HOVER,
						otherVisibility: CONST.TOKEN_DISPLAY_MODES.NONE,
					},
					san: {
						id: "san",
						mincolor: "#000000",
						maxcolor: "#000000",
						position: "bottom-outer",
						attribute: "SAN",
						label: "SAN",
						style: "fraction",
						ownerVisibility: CONST.TOKEN_DISPLAY_MODES.HOVER,
						otherVisibility: CONST.TOKEN_DISPLAY_MODES.NONE,
					},
				},
			});
		}
	});

	Hooks.on("renderSettings", async (app, html) => {
		// V13 always receives plain DOM elements
		const section = document.createElement("section");
		section.innerHTML = '<h4 class="divider">Sistema de Jogo</h4>';
		const credits = document.createElement("a");
		const discord = document.createElement("a");

		section.classList.add("flexcol");
		section.classList.add("op", "sidebar-heading");

		credits.classList.add("button", "credits");
		credits.href = "javascript:void(0)";
		credits.rel = "nofollow noopener";
		credits.target = "_blank";
		credits.innerHTML = `<i class="fa-solid fa-info-circle"></i> ${game.i18n.localize("op.Credits")}`;

		discord.classList.add("button");
		discord.href = "https://discord.gg/G8AwJwJXa5";
		discord.rel = "nofollow noopener";
		discord.target = "_blank";
		discord.innerHTML = `<i class="fa-brands fa-discord"></i> ${game.i18n.localize("op.Discord")}`;

		// const wiki = document.createElement('a');
		// wiki.classList.add('button');
		// wiki.href = 'javascript:void(0)';
		// wiki.rel = 'nofollow noopener';
		// wiki.target = '_blank';
		// wiki.textContent = game.i18n.localize('op.Wiki');

		const badge = document.createElement("section");
		badge.classList.add("flexcol");
		badge.classList.add("op", "system-badge");
		badge.innerHTML = `
    <img src="systems/ordemparanormal/media/op-logo.png" 
		data-tooltip="${game.i18n.localize("op.op")}" alt="${game.system.title}">
    <span class="system-info">${game.i18n.localize("op.sidebar.updateNotes")} 
		<strong>${game.system.version}</strong> </span>
		<p><span class="system-info" data-tooltip="${game.i18n.localize("op.sidebar.discord")}">
		<i class="fa-brands fa-discord"></i> souowendel</span>&nbsp;&nbsp;
		<a href="https://x.com/EuSouOWendel" target="_blank" data-tooltip="${game.i18n.localize("op.sidebar.twitter")}">
		<span class="system-info"><i class="fa-brands fa-twitter"></i> souowendel</span></p>
  `;

		// V13: Use standard DOM insertion
		const infoElement = html.querySelector(".info");
		if (infoElement) {
			infoElement.insertAdjacentElement("afterend", section);
		}

		const sidebarHeading = html.querySelector(".sidebar-heading");
		if (sidebarHeading) {
			sidebarHeading.insertAdjacentElement("beforebegin", badge);
		}

		section.appendChild(discord);
		section.appendChild(credits);
		// section.appendChild(wiki);

		const creditsDialog = html.querySelector(".credits");
		creditsDialog.addEventListener("click", async function (ev) {
			// V13: Use namespaced renderTemplate
			const content = await foundry.applications.handlebars.renderTemplate(
				"systems/ordemparanormal/templates/dialog/credits.html"
			);
			// V13: Use DialogV2
			new foundry.applications.api.DialogV2({
				window: {
					title: "Créditos no Desenvolvimento do Sistema",
				},
				content: content,
				buttons: [
					{
						action: "close",
						label: "Fechar",
						default: true,
					},
				],
				render: (event, html) => console.log("Janela (dialog) de créditos foi renderizada corretamente."),
				close: (event, html) => console.log("Janela (dialog) foi fechada com sucesso!"),
			}).render(true);
		});
	});

	// Clear "reaction used this round" flags from agents when a combat ends so the
	// trackers don't leak across encounters. During an active combat we compare
	// `flag === game.combat.round` directly, so stale flags from prior rounds are
	// already inert — no per-round cleanup needed. Guard with the first-active-GM
	// check so multiple connected GMs don't race on the same unset.
	Hooks.on("deleteCombat", async (combat) => {
		const firstGM = game.users.find((u) => u.isGM && u.active);
		if (!firstGM || firstGM.id !== game.user.id) return;
		const promises = [];
		for (const combatant of combat.combatants ?? []) {
			const actor = combatant.actor;
			if (actor?.type !== "agent") continue;
			if (actor.getFlag("ordemparanormal", "reactionUsedRound") == null) continue;
			promises.push(actor.unsetFlag("ordemparanormal", "reactionUsedRound"));
		}
		if (promises.length) await Promise.all(promises);
	});

	// Defense-in-depth: also clear the flag at combatStart. Without this, a stale
	// flag from a previous combat that wasn't deleted (e.g. GM ended but kept it
	// for log purposes) could collide with the new combat's round number — same
	// agent, same numeric round = falsely "already used" reaction in the new fight.
	Hooks.on("combatStart", async (combat) => {
		const firstGM = game.users.find((u) => u.isGM && u.active);
		if (!firstGM || firstGM.id !== game.user.id) return;
		const promises = [];
		for (const combatant of combat.combatants ?? []) {
			const actor = combatant.actor;
			if (actor?.type !== "agent") continue;
			if (actor.getFlag("ordemparanormal", "reactionUsedRound") == null) continue;
			promises.push(actor.unsetFlag("ordemparanormal", "reactionUsedRound"));
		}
		if (promises.length) await Promise.all(promises);
	});

	// When an agent's reactionUsedRound flag changes (set or unset), re-render
	// any chat messages with a pending reaction targeting that defender. Without
	// this, a second pending attack card against the same PC would keep showing
	// dodge/block buttons as enabled until something else triggered a render —
	// the GM would reject the click via _autoResolveStale, but the local UI
	// looks misleading. Foundry uses both `setFlag` (writes path) and
	// `unsetFlag` (writes `-=key` deletion marker), so we check both shapes.
	Hooks.on("updateActor", (actor, changes) => {
		// Fast filter — the flag we care about only lives on agents, and most
		// actor updates have nothing to do with reactions. Bail before the more
		// expensive flag/messages scan when we can.
		if (actor?.type !== "agent") return;
		const op = changes?.flags?.ordemparanormal;
		const setChanged = op?.reactionUsedRound !== undefined;
		const unsetChanged = op?.["-=reactionUsedRound"] !== undefined;
		const wholeNamespaceUnset = changes?.flags?.["-=ordemparanormal"] !== undefined;
		if (!setChanged && !unsetChanged && !wholeNamespaceUnset) return;
		const actorUuid = actor.uuid;
		for (const msg of game.messages ?? []) {
			const pending = msg.getFlag?.("ordemparanormal", "reactionPending");
			if (!pending || pending.defenderUuid !== actorUuid) continue;
			ui.chat?.updateMessage?.(msg);
		}
	});

	// Sync the automatic health conditions (morrendo <= PV 0, machucado <= PV half)
	// when an agent's PV changes — covers both damage and healing. GM-authoritative
	// (only the responsible GM writes) so a status isn't toggled once per client.
	Hooks.on("updateActor", (actor, changes) => {
		if (actor?.type !== "agent") return;
		if (changes?.system?.PV?.value === undefined && changes?.system?.PV?.max === undefined) return;
		const firstGM = game.users.find((u) => u.isGM && u.active);
		if (game.user !== firstGM) return;
		actor.reconcileHealthConditions();
	});

	// Re-render the most recent item card when targeting changes so target-info stays current
	Hooks.on("targetToken", (user, _token, _targeted) => {
		if (user.id !== game.user?.id) return;
		const msg = [...(game.messages ?? [])]
			.reverse()
			.find((m) => m.author?.id === user.id && m.content?.includes("chat-card item-card"));
		if (!msg) return;
		// Foundry v13: ui.chat.updateMessage re-renders the message HTML in-place
		if (ui.chat?.updateMessage) {
			ui.chat.updateMessage(msg);
		}
	});

	// Combat tracker: show PV/HP next to initiative for each combatant.
	//
	// Selector compatibility: Foundry v12 used `.initiative`, v13 renamed it to
	// `.token-initiative`. We try the v13 selector first and fall back to v12,
	// so this hook keeps working across versions. The HP display is appended
	// inside `.token-name` (next to the combatant's name) where it's visible
	// regardless of how the initiative cell is laid out.
	Hooks.on("renderCombatTracker", (_app, html, _data) => {
		const combat = game.combat;
		if (!combat) return;
		for (const combatant of combat.combatants) {
			const li = html.querySelector(`[data-combatant-id="${combatant.id}"]`);
			if (!li) continue;
			if (li.querySelector(".op-hp-display")) continue; // idempotent re-render
			const actor = combatant.actor;
			if (!actor) continue;
			// Threats' HP é informação reservada ao MJ; PV de agentes é privado
			// (cada jogador só vê o do próprio personagem). Decisão pura em
			// helpers/visibility.mjs#shouldShowCombatantHP (unit-testada).
			if (!shouldShowCombatantHP(actor, game.user.isGM, actor.isOwner)) continue;
			let hp = null;
			if (actor.type === "agent") {
				const pv = actor.system.PV;
				if (pv) hp = { value: pv.value, max: pv.max };
			} else if (actor.type === "threat") {
				const hpSys = actor.system.attributes?.hp;
				if (hpSys) hp = { value: hpSys.value, max: hpSys.max };
			}
			if (!hp || !hp.max) continue;
			const pct = hp.value / hp.max;
			const color = pct > 0.5 ? "#2e7d32" : pct > 0.25 ? "#f57c00" : "#c62828";

			const hpEl = document.createElement("span");
			hpEl.classList.add("op-hp-display");
			hpEl.style.cssText = `color:${color};font-size:11px;margin-left:4px;opacity:0.9;font-weight:600;`;
			hpEl.textContent = `${hp.value}/${hp.max}`;
			hpEl.title = actor.type === "agent" ? "PV" : "HP";

			// Try anchors in priority order. `.token-name` is the most stable
			// (exists in both v12 and v13); the others are kept as defensive
			// fallbacks for edge cases or future layout shifts.
			const anchor =
				li.querySelector(".token-name strong.name") ??
				li.querySelector(".token-name") ??
				li.querySelector(".token-initiative") ??
				li.querySelector(".initiative");
			if (anchor) anchor.after(hpEl);
		}
	});

	// Re-render only when an actor that's actually in the active combat is
	// updated — without this filter we'd fire a tracker render on every actor
	// mutation in the world (effect application, sheet edits, module flag
	// updates, etc.), which is visible as UI stutter when many actors are loaded.
	Hooks.on("updateActor", (actor) => {
		if (!game.combat?.combatants.some((c) => c.actor?.id === actor.id)) return;
		ui.combat?.render();
	});
}
