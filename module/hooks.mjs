import chatCommands from "./chat/chat-commands.mjs";

/** */
export default function () {
	// Register chat commands (/dt, /oposto)
	chatCommands();

	// Expire temporary active effects when their duration runs out
	Hooks.on("combatTurn", async (combat, _updateData, _updateOptions) => {
		if (!game.user.isGM) return;
		const combatant = combat.combatant;
		const actor = combatant?.actor;
		if (!actor) return;

		// Per Foundry v13 docs, use combat.turns.length (sorted, post-defeated-filter)
		// for the absolute turn count when computing per-turn duration.
		const turnsPerRound = Math.max(1, combat.turns?.length ?? 1);
		const toExpire = [];
		for (const effect of actor.allApplicableEffects()) {
			if (effect.disabled || !effect.isTemporary) continue;
			const dur = effect.duration;
			if (!dur) continue;

			const roundsLeft =
				dur.startRound != null && dur.rounds != null ? dur.rounds - (combat.round - dur.startRound) : Infinity;
			const roundsElapsed = dur.startRound != null ? combat.round - dur.startRound : 0;
			const turnsElapsed = dur.startTurn != null ? combat.turn - dur.startTurn : 0;
			const totalTurns = roundsElapsed * turnsPerRound + turnsElapsed;
			const turnsLeft = dur.turns != null ? dur.turns - totalTurns : Infinity;

			if (roundsLeft <= 0 || turnsLeft <= 0) toExpire.push({ id: effect.id, name: effect.name });
		}

		if (toExpire.length) {
			await actor.deleteEmbeddedDocuments(
				"ActiveEffect",
				toExpire.map((e) => e.id)
			);
			for (const { name } of toExpire) {
				ChatMessage.create({
					content: game.i18n.format("op.effectExpired", { effect: name, actor: actor.name }),
				});
			}
		}
	});
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
