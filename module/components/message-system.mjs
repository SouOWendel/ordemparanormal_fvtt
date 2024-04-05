/* -------------------------------------------- */
/*  Author: @aMediocreDad                       */
/* -------------------------------------------- */
import semverComp from '../../utils/semver-compare.mjs';

const SYSTEM_NAME = 'ordemparanormal';

// eslint-disable-next-line require-jsdoc
export default async function displayMessages() {
	const messages = await fetchMessage(`systems/${SYSTEM_NAME}/media/messages/messages.jsonc`);
	// const messages = await fetchMessage('http://localhost:3000/notes');

	messages.forEach((message, indice) => {
		handleDisplay(message, indice, messages);
	});
}

const fetchMessage = async (url) => {
	return await fetch(url)
		.then((resp) => resp.text())
		.then((jsonc) => JSON.parse(stripJSON(jsonc)));
};

const stripJSON = (data) => {
	return data.replace(/[^:]\/\/(.*)/g, '');
};

const handleDisplay = (msg, i, messages) => {
	const { content, title, type } = msg;
	if (!isCurrent(msg)) return;
	if (type === 'prompt') return displayPrompt(title, content, i, messages);
	if (type === 'chat') return sendToChat(title, content);
};

const isCurrent = (msg) => {
	const settings = game.settings.get(SYSTEM_NAME, 'patchNotes');
	const isDisplayable = !msg.display === 'once' || !settings; /* !hasDisplayed(msg.title); */
	const correctCoreVersion =
		foundry.utils.isNewerVersion(msg['max-core-version'] ?? '100.0.0', game.version) &&
		foundry.utils.isNewerVersion(game.version, msg['min-core-version'] ?? '0.0.0');
	const correctSysVersion = semverComp(
		msg['min-sys-version'] ?? '0.0.0',
		game.system.version,
		msg['max-sys-version'] ?? '100.0.0',
		{ gEqMin: true, lEqMax: true }
	);
	console.log(correctSysVersion);
	return isDisplayable && correctCoreVersion && correctSysVersion;
	// return correctCoreVersion && correctSysVersion;
};

// const hasDisplayed = identifier => {
// 	const settings = game.settings.get(SYSTEM_NAME, 'patchNotes');
// 	console.log(settings);
// 	if (settings?.includes(identifier)) return true;
// 	else return false;
// };

const displayPrompt = (title, content, i, messages) => {
	content = content.replace('{name}', game.user.name);

	const dialogOptions = {
		width: 800,
		height: 630,
		classes: ['ordemparanormal', 'no-scroll'],
	};

	const config = {
		title: title,
		content: `
			<section class='ordemparanormal grid grid-2col'>
				<aside class='sidebar scroll content-dialog'>
					<a href="https://discord.gg/G8AwJwJXa5" class="no-orange-hyperlink" target="_blank">
						<div class="announcement flex-group-center discord" style="background: url('systems/ordemparanormal/media/assets/discord.png'); border: 1px solid #00000020">
							<div>
								<h1><i class="fa-brands fa-discord"></i> Forja dos Narradores</h1>
								<p>Forge amizades, aplicativos e histórias.</p>
							</div>
						</div>
					</a>
					<a href="https://linktr.ee/devilline" class="no-orange-hyperlink" target="_blank">
						<div class="announcement flex-group-center" style="background: url('systems/ordemparanormal/media/assets/deburinebanner.png'); border: 1px solid #00000020">
						<p></p>
						</div>
					</a>
					<a href="" class="no-orange-hyperlink">
						<div class="announcement flex-group-center" style="border: 1px solid #00000020">
						<p></p>
						</div>
					</a>
				</aside>
				<div class="scroll content-dialog">
					${content}
				</div>
			</section>
			<footer style="position:absolute; bottom: 0; width: 100%; left: 0; padding: 0px 8px; border-top: 1px #00000030 solid;"><p>Você pode desativar as notas de atualização nas configurações do sistema.</p></footer>`,
		buttons: {
			previous: {
				icon: '<i class="fas fa-arrow-left"></i>',
				label: 'Atualização Anterior',
				callback: async () => {
					const b = messages[i - 1] ? i - 1 : i;
					if (messages[b]) displayPrompt(messages[b].title, messages[b].content, b, messages);
				},
			},
			next: {
				icon: '',
				label: 'Próxima Atualização <i class="fas fa-arrow-right"></i>',
				callback: async () => {
					const b = messages[i + 1] ? i + 1 : i;
					if (messages[b]) displayPrompt(messages[b].title, messages[b].content, b, messages);
				},
			},
		},
	};

	const d = new Dialog(config, dialogOptions);
	return d.render(true);

	// return Dialog.prompt({
	// 	title: title,
	// 	content: `<section class='grid grid-2col'>${content}</section>`,
	// 	// label: 'Understood!',
	// 	options: { width: 400, height: 400, classes: [SYSTEM_NAME, 'dialog'] },
	// 	// callback: () => setDisplayed(title),
	// });
};

const sendToChat = (title, content) => {
	content = content.replace('{name}', game.user.name);
	// setDisplayed(title);
	const footer = '<footer class="nue">aaaaaaa</footer>';
	return ChatMessage.create({
		whisper: [game.user.id],
		speaker: { alias: 'Twilight: 2000 4E' },
		flags: { core: { canPopout: true } },
		title: title,
		content: `<div class="chat-card"><h3 class="nue">${title}</h3>${content}${footer}</div>`,
	});
};

// const setDisplayed = async identifier => {
// 	const settings = game.settings.get(SYSTEM_NAME, 'patchNotes');
// 	settings.push(identifier);
// 	await game.settings.set(SYSTEM_NAME, 'messages', settings.flat());
// };
