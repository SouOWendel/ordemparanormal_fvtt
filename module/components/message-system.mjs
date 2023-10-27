/* -------------------------------------------- */
/*  Author: @aMediocreDad                       */
/* -------------------------------------------- */
import semverComp from '../../utils/semver-compare.mjs';

const SYSTEM_NAME = 'ordemparanormal';

// eslint-disable-next-line require-jsdoc
export default async function displayMessages() {
	const messages = await fetch(`systems/${SYSTEM_NAME}/media/messages/messages.jsonc`)
		.then(resp => resp.text())
		.then(jsonc => JSON.parse(stripJSON(jsonc)));

	messages.forEach(message => {
		handleDisplay(message);
	});
}

const stripJSON = data => {
	return data.replace(/[^:]\/\/(.*)/g, '');
};

const handleDisplay = msg => {
	const { content, title, type } = msg;
	if (!isCurrent(msg)) return;
	if (type === 'prompt') return displayPrompt(title, content);
	if (type === 'chat') return sendToChat(title, content);
};

const isCurrent = msg => {
	const settings = game.settings.get(SYSTEM_NAME, 'patchNotes');
	const isDisplayable = !msg.display === 'once' || !settings; /* !hasDisplayed(msg.title); */
	const correctCoreVersion =
    foundry.utils.isNewerVersion(msg['max-core-version'] ?? '100.0.0', game.version) &&
    foundry.utils.isNewerVersion(game.version, msg['min-core-version'] ?? '0.0.0');
	const correctSysVersion = semverComp(
		msg['min-sys-version'] ?? '0.0.0',
		game.system.version,
		msg['max-sys-version'] ?? '100.0.0',
		{ gEqMin: true, lEqMax: true },
	);
	return isDisplayable && correctCoreVersion && correctSysVersion;
	// return correctCoreVersion && correctSysVersion;
};

// const hasDisplayed = identifier => {
// 	const settings = game.settings.get(SYSTEM_NAME, 'patchNotes');
// 	console.log(settings);
// 	if (settings?.includes(identifier)) return true;
// 	else return false;
// };

const displayPrompt = (title, content) => {
	content = content.replace('{name}', game.user.name);

	const dialogOptions = {
		width: 800,
		height: 600,
		classes: ['ordemparanormal', 'no-scroll'],
	};

	const d = new Dialog({
		title: title,
		content: `
			<section class='grid grid-2col'>
				<aside class='sidebar scroll content-dialog'>
					<a href="https://discord.gg/G8AwJwJXa5" class="no-orange-hyperlink">
						<div class="adverts flex-group-center discord" style="background-color: #5865F2">
							<div>
								<h1>Community Devs</h1>
								<p>Entre no nosso discord para atualizações.</p>
							</div>
						</div>
					</a>
					<a href="" class="no-orange-hyperlink">
						<div class="adverts flex-group-center" style="border: 1px solid #00000020">
						<p>Discord!</p>
						</div>
					</a>
					<a href="" class="no-orange-hyperlink">
						<div class="adverts flex-group-center" style="border: 1px solid #00000020">
						<p>Discord!</p>
						</div>
					</a>
				</aside>
				<div class="scroll content-dialog">
					${content}
				</div>
			</section>
			<footer style="position:absolute; bottom: 0; width: 100%; left: 0; padding: 0px 8px; border-top: 1px #00000030 solid;"><p>Você pode desativar as notas de atualização nas configurações do sistema.</p></footer>`,
		buttons: {
			// one: {
			// 	icon: '<i class="fas fa-check"></i>',
			// 	label: 'Option One',
			// 	callback: () => console.log('Chose One')
			//    },
			// two: {
			// 	icon: '<i class="fas fa-times"></i>',
			// 	label: 'Option Two',
			// 	callback: () => console.log('Chose Two')
			//    }
		},
	   }, dialogOptions);

	   console.log(d.element);
	
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