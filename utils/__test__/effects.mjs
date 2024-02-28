// TODO: testar os loops com do while, enquanto há objectos, vasculhe tudo.
/**
 * Resgata todos os caminhos json em uma profundidade de até 3 objetos.
 **/
async function rescueAllPathEffects() {
	const newHyperItem = {
		str: [],
		numb: [],
		obj: [],
	};
	const templateJson = await fetchMessage(
		'systems/ordemparanormal/template.json',
	);

	let pathTemplate = templateJson.Actor.agent;
	for (const data in pathTemplate) {
		if (typeof pathTemplate[data] === 'string')
			newHyperItem.str.push('system.' + data);
		else if (typeof pathTemplate[data] === 'number')
			newHyperItem.numb.push('system.' + data);
		else if (typeof pathTemplate[data] === 'object') {
			const objectKey = pathTemplate[data];
			const query = `system.${data}.`;
			for (const data2 in objectKey) {
				if (typeof objectKey[data2] === 'string')
					newHyperItem.str.push(query + data2);
				else if (typeof objectKey[data2] === 'number')
					newHyperItem.numb.push(query + data2);
				else if (typeof objectKey[data2] === 'object') {
					const objectKey2 = objectKey[data2];
					const query2 = query + data2 + '.';
					for (const data3 in objectKey2) {
						if (typeof objectKey2[data3] === 'string')
							newHyperItem.str.push(query2 + data3);
						else if (typeof objectKey2[data3] === 'number')
							newHyperItem.numb.push(query2 + data3);
					}
				}
			}
		}
	}

	pathTemplate = templateJson.Actor.templates.base;
	for (const data in pathTemplate) {
		if (typeof pathTemplate[data] === 'string')
			newHyperItem.str.push('system.' + data);
		else if (typeof pathTemplate[data] === 'number')
			newHyperItem.numb.push('system.' + data);
		else if (typeof pathTemplate[data] === 'object') {
			const objectKey = pathTemplate[data];
			const query = `system.${data}.`;
			for (const data2 in objectKey) {
				if (typeof objectKey[data2] === 'string')
					newHyperItem.str.push(query + data2);
				else if (typeof objectKey[data2] === 'number')
					newHyperItem.numb.push(query + data2);
				else if (typeof objectKey[data2] === 'object') {
					const objectKey2 = objectKey[data2];
					const query2 = query + data2 + '.';
					for (const data3 in objectKey2) {
						if (typeof objectKey2[data3] === 'string')
							newHyperItem.str.push(query2 + data3);
						else if (typeof objectKey2[data3] === 'number')
							newHyperItem.numb.push(query2 + data3);
					}
				}
			}
		}
	}

	return newHyperItem;
}

const fetchMessage = async (url) => {
	return await fetch(url)
		.then((resp) => resp.text())
		.then((jsonc) => JSON.parse(stripJSON(jsonc)));
};
const stripJSON = (data) => {
	return data.replace(/[^:]\/\/(.*)/g, '');
};

export { rescueAllPathEffects };
