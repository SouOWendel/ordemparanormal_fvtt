# API de Condições

Contrato público para módulos de terceiros lerem e alterarem as condições de Ordem Paranormal.

Vive em `game.ordemparanormal.conditions`, a partir do hook `init`.

## Por que usar

Sem a API, um módulo tem duas saídas ruins:

```js
// Frágil: depende de um caminho interno que pode mudar sem aviso.
import { applyCondition } from "/systems/ordemparanormal/module/helpers/conditions.mjs";

// Funciona pela metade: ignora as regras do sistema, como o escalonamento.
await actor.toggleStatusEffect("abalado", { active: true });
```

A API resolve os dois: não acopla ao caminho interno e mantém as regras do sistema
em jogo — hoje o escalonamento, amanhã o que mais for automatizado.

Tudo sob `module/helpers/conditions.mjs` é **interno**. Só o que está nesta página
é suportado.

## Começando

```js
const API = game.ordemparanormal.conditions;

await API.apply(actor, "abalado");
API.isActive(actor, "abalado"); // true
```

Antes de usar, confirme que o sistema está presente e na versão que você espera:

```js
const API = game.ordemparanormal?.conditions;
if ((API?.version ?? 0) >= 1) {
	// seguro usar
}
```

`version` sobe quando o formato muda de um jeito que quebraria quem já usa.
Acréscimos não sobem a versão.

## Métodos

### `list()`

Todas as condições do sistema, como descritores congelados.

```js
API.list();
// [{ id: "abalado", label: "Abalado", labelKey: "op.conditions.abalado", … }, …]
```

O array e os descritores mantêm identidade estável entre chamadas — dá pra
guardar em cache e comparar por referência.

### `get(conditionId)`

Um descritor, ou `null` se a condição não existir.

```js
API.get("desprevenido").defensePenalty; // 5
API.get("nao-existe"); // null
```

### `has(conditionId)`

Se o **sistema** define a condição. Não diz nada sobre nenhum ator.

```js
API.has("morrendo"); // true
```

### `isActive(target, conditionId)`

Se a condição está no ator agora.

```js
API.isActive(actor, "caido"); // true/false
```

### `active(target)`

Todos os ids de condição no ator. Ignora efeitos que não sejam condições do sistema.

```js
API.active(actor); // ["machucado", "abalado"]
```

### `apply(target, conditionId, options?)`

Aplica a condição. Devolve `{ id, effect, escalatedFrom }`, ou `null` se o ator
ou a condição forem desconhecidos.

```js
await API.apply(actor, "abalado");
// { id: "abalado", effect: ActiveEffect, escalatedFrom: null }

// aplicar de novo escalona
await API.apply(actor, "abalado");
// { id: "apavorado", effect: ActiveEffect, escalatedFrom: "abalado" }
```

**Sempre leia o `id` de volta.** Sob escalonamento ele difere do que você pediu, e
o escalonamento pode encadear:

```js
await API.apply(actor, "fatigado"); // { id: "fatigado", escalatedFrom: null }
await API.apply(actor, "fatigado"); // { id: "exausto", escalatedFrom: "fatigado" }
```

Passe `{ active: false }` para remover, ou use `remove()`.

### `remove(target, conditionId)`

Remove a condição. Mesmo retorno de `apply`.

```js
await API.remove(actor, "abalado");
```

## Alvos aceitos

Todo método que recebe um ator aceita `Actor`, `Token` ou `TokenDocument`:

```js
API.isActive(token, "caido");
API.apply(canvas.tokens.controlled[0], "abalado");
```

## Descritor

```js
{
  id: "desprevenido",              // id da condição
  label: "Desprevenido",           // nome já traduzido, pronto pra exibir
  labelKey: "op.conditions.desprevenido", // a chave i18n por trás do label
  img: "icons/svg/…",              // ícone
  overlay: false,                  // se desenha como overlay do token
  escalatesTo: null,               // pra que condição vira ao reaplicar, ou null
  defensePenalty: 5,               // penalidade de Defesa, 0 quando não tem
}
```

Descritores são congelados. `defensePenalty` é informativo: quem aplica é o
sistema, na resolução do ataque, e penalidades iguais não acumulam — vale a mais
severa (livro, p. 312).

## Hooks

```js
API.hooks;
// {
//   applied:   "ordemparanormal.conditionApplied",
//   removed:   "ordemparanormal.conditionRemoved",
//   escalated: "ordemparanormal.conditionEscalated",
// }
```

Use as constantes em vez de escrever a string na mão.

### `applied` / `removed`

```js
Hooks.on(API.hooks.applied, (actor, conditionId, effect, userId) => { … });
Hooks.on(API.hooks.removed, (actor, conditionId, effect, userId) => { … });
```

Disparam **por qualquer caminho** que ponha ou tire uma condição: esta API, o
Token HUD, ou a automação de PV do próprio sistema. Você escuta num lugar só.

### `escalated`

```js
Hooks.on(API.hooks.escalated, (actor, deId, paraId, userId) => { … });
```

Só o `applyCondition` sabe que uma condição virou outra — os hooks acima saem dos
documentos de efeito e não distinguem escalonamento de um toggle comum.

Uma escalada `abalado → apavorado` emite, nesta ordem:

```
applied   abalado      (na primeira aplicação)
removed   abalado
escalated abalado → apavorado
applied   apavorado
```

### Cuidado obrigatório: `userId`

Os hooks chegam em **todos os clientes conectados**. Se o seu handler escreve
algo ou chama serviço externo, ele vai rodar uma vez por jogador na mesa. Filtre:

```js
Hooks.on(API.hooks.applied, (actor, conditionId, effect, userId) => {
  if (game.userId !== userId) return; // só quem causou a mudança segue
  await actor.setFlag("meu-modulo", "ultimaCondicao", conditionId);
});
```

Sem esse filtro, uma mesa com 4 jogadores executa o corpo 4 vezes.

O `escalated` sai apenas no cliente que fez a escrita, não em todos. Filtrar por
`userId` nos três deixa o comportamento consistente: você age uma vez, no cliente
certo, nos três eventos.

## Exemplo completo

Um módulo que anuncia no chat quando alguém fica apavorado:

```js
Hooks.once("ready", () => {
	const API = game.ordemparanormal?.conditions;
	if ((API?.version ?? 0) < 1) return;

	Hooks.on(API.hooks.applied, async (actor, conditionId, effect, userId) => {
		if (game.userId !== userId) return;
		if (conditionId !== "apavorado") return;

		const { label } = API.get(conditionId);
		await ChatMessage.create({
			content: `${actor.name} está ${label}!`,
			speaker: ChatMessage.getSpeaker({ actor }),
		});
	});
});
```

## Estabilidade

| Superfície                                               | Situação                                          |
| -------------------------------------------------------- | ------------------------------------------------- |
| `game.ordemparanormal.conditions`                        | Suportada. Mudança incompatível sobe a `version`. |
| Nomes dos hooks via `API.hooks`                          | Suportados.                                       |
| `module/api/conditions-api.mjs` importado por caminho    | Não suportado.                                    |
| `module/helpers/conditions.mjs` e qualquer outro interno | Não suportado, muda sem aviso.                    |

Sugestão original de [@antoniohbmonteiro](https://github.com/antoniohbmonteiro) na PR #98.
