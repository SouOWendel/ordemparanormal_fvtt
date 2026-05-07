/** */
export default function () {
	/**
	 * Criando o Hook preCreateActor para o módulo Bar Brawl adicionar
	 * uma terceira barra nos tokens criados, essa barra ira representar
	 * uns dos atributos bases dos personagens — os pontos de esforço.
	 * Bar Brawl Gitlab: https://gitlab.com/woodentavern/foundryvtt-bar-brawl
	 */
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
}
