/** */
export default function () {

	/**
	 * Criando o Hook preCreateActor para o módulo Bar Brawl adicionar
	 * uma terceira barra nos tokens criados, essa barra ira representar
	 * uns dos atributos bases dos personagens — os pontos de esforço.
	 * Bar Brawl Gitlab: https://gitlab.com/woodentavern/foundryvtt-bar-brawl
	 */
	Hooks.on('preCreateActor', function (actor, data) {
		if (actor.type === 'threat') {
			const prototypeToken = { disposition: -1, actorLink: false };
			actor.updateSource({ prototypeToken }); // Set disposition to "Hostile"
			actor.updateSource({
				'prototypeToken.flags.barbrawl.resourceBars': {
					'threatHPBar': {
						id: 'threatHPBar',
						mincolor: '#ff1a1a',
						maxcolor: '#80ff00',
						position: 'bottom-outer',
						attribute: 'attributes.hp',
						label: 'Pontos de Vida',
						style: 'fraction',
						ownerVisibility: CONST.TOKEN_DISPLAY_MODES.HOVER,
        	otherVisibility: CONST.TOKEN_DISPLAY_MODES.NONE,
					},
				},
			});
		}

		// TODO: APLICAR UMA CONFIGURAÇÃO DE BAR BRAWL PARA PD E OUTRA PARA PE E SAN.
		// Filtrando por tipos de Actors disponíveis no sistema.
		if (actor.type === 'agent') {
			const prototypeToken = { disposition: 1, actorLink: true }; // Set disposition to "Friendly"
			actor.updateSource({ prototypeToken });

			/**
		 * Adicionando configurações para todas as barras.
		 * Criando uma barra extra com o módulo Bar Brawl (configuração para os Pontos de PE)
		 */
			actor.updateSource({
				'prototypeToken.flags.barbrawl.resourceBars': {
					'pv': {
						id: 'pv',
						mincolor: '#ff1a1a',
						maxcolor: '#80ff00',
						position: 'bottom-outer',
						attribute: 'PV',
						label: 'PV',
						style: 'fraction',
						ownerVisibility: CONST.TOKEN_DISPLAY_MODES.HOVER,
        	otherVisibility: CONST.TOKEN_DISPLAY_MODES.NONE,

					},
					'pe': {
						id: 'pe',
						mincolor: '#242899',
						maxcolor: '#66a8ff',
						position: 'bottom-outer',
						attribute: 'PE',
						label: 'PE',
						style: 'fraction',
						ownerVisibility: CONST.TOKEN_DISPLAY_MODES.HOVER,
        	otherVisibility: CONST.TOKEN_DISPLAY_MODES.NONE,
					},
					'san': {
						id: 'san',
						mincolor: '#000000',
						maxcolor: '#000000',
						position: 'bottom-outer',
						attribute: 'SAN',
						label: 'SAN',
						style: 'fraction',
						ownerVisibility: CONST.TOKEN_DISPLAY_MODES.HOVER,
        	otherVisibility: CONST.TOKEN_DISPLAY_MODES.NONE,
					},
				},
			});
		}
	});

	Hooks.on('renderSettings', async (app, html) => {

		// const divider = document.createElement('h4');
		// divider.classList.add('divider');
		// divider.textContent = 'Sistema de Jogo';

		let section;
		let title;
		let credits;
		let discord;

		if (game.version.slice(0, 2) === '12') {
			html = html[0];
			section = document.createElement('div');
			title = document.createElement('h2');
			title.classList.add('v12-title');
			title.textContent = 'Sistema de Jogo';
			html.querySelector('#game-details').insertAdjacentElement('afterend', title);
			credits = document.createElement('button');
			discord = document.createElement('button');
		} else {
			section = document.createElement('section');
			section.innerHTML = '<h4 class="divider">Sistema de Jogo</h4>';
			credits = document.createElement('a');
			discord = document.createElement('a');
		}

		section.classList.add('flexcol');
		section.classList.add('op', 'sidebar-heading');

		credits.classList.add('button', 'credits');
		credits.href = 'javascript:void(0)';
		credits.rel = 'nofollow noopener';
		credits.target = '_blank';
		credits.innerHTML = `<i class="fa-solid fa-info-circle"></i> ${game.i18n.localize('op.Credits')}`;

		discord.classList.add('button');
		discord.href = 'https://discord.gg/G8AwJwJXa5';
		discord.rel = 'nofollow noopener';
		discord.target = '_blank';
		discord.innerHTML = `<i class="fa-brands fa-discord"></i> ${game.i18n.localize('op.Discord')}`;

		// const wiki = document.createElement('a');
		// wiki.classList.add('button');
		// wiki.href = 'javascript:void(0)';
		// wiki.rel = 'nofollow noopener';
		// wiki.target = '_blank';
		// wiki.textContent = game.i18n.localize('op.Wiki');

		const badge = document.createElement('section');
		badge.classList.add('flexcol');
		badge.classList.add('op', 'system-badge');
		badge.innerHTML = `
    <img src="systems/ordemparanormal/media/op-logo.png" 
		data-tooltip="${game.i18n.localize('op.op')}" alt="${game.system.title}">
    <span class="system-info">${game.i18n.localize('op.sidebar.updateNotes')} 
		<strong>${game.system.version}</strong> </span>
		<p><span class="system-info" data-tooltip="${game.i18n.localize('op.sidebar.discord')}">
		<i class="fa-brands fa-discord"></i> souowendel</span>&nbsp;&nbsp;
		<a href="https://x.com/EuSouOWendel" target="_blank" data-tooltip="${game.i18n.localize('op.sidebar.twitter')}">
		<span class="system-info"><i class="fa-brands fa-twitter"></i> souowendel</span></p>
  `;

		if (game.version.slice(0, 2) === '12') {
			html.querySelector('.v12-title').insertAdjacentElement('afterend', section);
		} else {
			html.querySelector('.info').insertAdjacentElement('afterend', section);
		}
		html.querySelector('.sidebar-heading').insertAdjacentElement('beforebegin', badge);
		section.appendChild(discord);
		section.appendChild(credits);
		// section.appendChild(wiki);

		const creditsDialog = html.querySelector('.credits');
		creditsDialog.addEventListener('click', async function (ev) {
			const content = await renderTemplate('systems/ordemparanormal/templates/dialog/credits.html');
			new Dialog({
				title: 'Créditos no Desenvolvimento do Sistema',
				content: content,
				buttons: {},
				render: (html) => console.log('Janela (dialog) de créditos foi renderizada corretamente.'),
				close: (html) => console.log('Janela (dialog) foi fechada com sucesso!'),
			}).render(true);
		});
	});

}