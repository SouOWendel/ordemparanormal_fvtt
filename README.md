<div align="center">

<!-- <img src="https://github.com/SouOWendel/ordemparanormal-fvtt/blob/main/media/op-logo.png?raw=true" alt="logo do Ordem Paranormal"> -->
<p dir="auto" style="text-align: center;">Acesse o <a href="https://discord.gg/G8AwJwJXa5">Servidor do Discord</a> para atualiza&ccedil;&otilde;es e feedbacks, para postagens em geral, siga-me no <a href="https://twitter.com/EuSouOWendel">Twitter</a>, se realmente curtir o conte&uacute;do, n&atilde;o deixe de apoiar com qualquer valor na chave PIX: souowendel@gmail.com ou utilizando a plataforma do <a href="https://ko-fi.com/souowendel">Ko-fi</a>.&nbsp;</p>

![Supported Foundry Versions](https://img.shields.io/endpoint?url=https%3A%2F%2Ffoundryshields.com%2Fversion%3Fstyle%3Dflat%26url%3Dhttps%3A%2F%2Fgithub.com%2FSouOWendel%2Fordemparanormal-fvtt%2Freleases%2Flatest%2Fdownload%2Fsystem.json)
![Meu usuário do Discord: souowendel](https://dcbadge.vercel.app/api/shield/294989840104161280?style=flat&compact=true)
[![Meu Twitter: EuSouOWendel](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white&style=flat&compact=true)](https://twitter.com/EuSouOWendel)
<br>
[![Meu gmail: souowendel@gmail.com](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white&style=flat&compact=true)](https://mail.google.com/mail/u/0/?fs=1&to=souowendel@gmail.com&su=Enquiry&tf=cm)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Conventional Changelog](https://img.shields.io/badge/changelog-conventional-brightgreen.svg)](http://conventional-changelog.github.io)
![GitHub Downloads (all assets, latest release)](https://img.shields.io/github/downloads/SouOWendel/ordemparanormal_fvtt/latest/total)
![CI](https://github.com/SouOWendel/ordemparanormal_fvtt/actions/workflows/ci.yml/badge.svg)

</div>

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Y8Y8PRQ6Z)

# Sobre o Ordem Paranormal.

Ordem Paranormal é um sistema e/ou universo de investigação paranormal criado por Rafael Lange, mais conhecido pelo seu pseudônimo Cellbit. Com base nisso, este é um **sistema não-oficial** adaptado para o FoundryVTT, que utiliza dos conteúdos considerados <i>Open Game License¹</i>, conforme a licença incluída juntamente ao livro de regras.

> No universo de Ordem Paranormal, o paranormal existe, mas está separado da nossa realidade por uma membrana. Essa membrana pode ser enfraquecida pelo medo, e alguns grupos de ocultistas estão dispostos a fazer isso para invocar entidades do Outro Lado.
> Para combater essa ameaça, foi criada a Ordo Realitas, uma organização de detetives paranormais que vivem vidas duplas. Os agentes da Ordem secretamente investigam e combatem o paranormal, protegendo a Realidade e lutando contra aqueles que querem mergulhar o mundo em caos.

## Começando o Desenvolvimento.

1. Clone o repositório com `git clone https://github.com/SouOWendel/ordemparanormal_fvtt.git ordemparanormal`
2. Instale as dependências de desenvolvimento com `npm install`
3. Compile os compêndios com `npm run build:db` (converte os JSONs de `packs/_source/` para LevelDB)
4. Crie um `.env` baseado no `.env.example` com suas credenciais do Foundry
5. Suba o ambiente de desenvolvimento com `npm run dev` (Docker na porta 30000)

## Testes

### Tier 1 — Testes Unitários (Vitest)

Rodam fora do Foundry, via Node.js. Cobrem schemas de TypeDataModel, cálculos derivados, migrações e lógica de itens.

```bash
npm test            # roda os testes uma vez
npm run test:watch  # modo watch (reexecuta ao salvar)
npm run test:coverage  # gera relatório de cobertura
```

Os testes rodam automaticamente no GitHub Actions a cada push e pull request.

### Tier 2 — Testes de Integração (Quench)

Rodam dentro do Foundry com o módulo [Quench](https://github.com/Ethaks/FVTT-Quench). Cobrem Active Effects, criação de actores/itens, sheets e configurações do sistema.

```bash
npm run dev         # sobe o Foundry via Docker na porta 30000
npm run dev:down    # para o container
```

1. Acesse `http://localhost:30000`, crie um mundo com o sistema Ordem Paranormal
2. Ative o módulo **Quench** no mundo. Execute também a validação com **Bar Brawl** ativo e desativado.
3. Abra o painel do Quench na sidebar e clique **Run All**

As suites disponíveis:

- **OP | Agent Actor: prepareDerivedData** — classes, progressão, PV/PE/SAN, defesa, rituais, patentes
- **OP | Actor: Active Effects** — resolução de `@variáveis`, stacking, item-transferred AEs
- **OP | Item: isCritical & getRollData** — parsing de fórmulas críticas, dados de rolagem
- **OP | Sheets: registration & dataModels** — registro de sheets e TypeDataModels no CONFIG

## Barras de recursos dos tokens

O sistema exibe barras próprias no Foundry 13 e 14, sem exigir módulos: PV, PE e SAN para agentes; PV e PD com **Jogando sem Sanidade**; somente PV para ameaças. Mestre e proprietário do token podem vê-las ao passar o mouse. O Token HUD permite editar os recursos com valores absolutos, deltas (`+5`, `-2`) e percentuais (`50%`, `-10%`).

A mudança de Jogando sem Sanidade atualiza os dados preparados, as fichas abertas e os tokens sem exigir recarregamento ou recriação. Os cálculos e valores persistidos dos recursos continuam sob responsabilidade das regras existentes.

**Bar Brawl é opcional.** Quando ativo, ele assume o desenho, o HUD e suas opções avançadas. Use uma versão compatível com seu Foundry (1.9.0 no v13; 1.9.4 no v14). Ativar ou desativar o módulo exige o recarregamento normal de módulos.

Os padrões fornecidos pelo sistema acompanham a regra selecionada. Em mundos antigos, somente conjuntos reconhecidos integralmente como padrões do sistema são atualizados. Qualquer personalização de barras, inclusive cor, posição, ordem, visibilidade, inclusão ou remoção, preserva o conjunto inteiro e interrompe sua atualização automática. Padrões personalizados salvos no próprio Bar Brawl também têm precedência. Assim, um conjunto personalizado pode continuar mostrando PE e SAN mesmo com a regra de PD ativa.

O mestre pode escolher **Reaplicar padrões de recursos do sistema** na configuração do token ou de seu protótipo para substituir explicitamente o conjunto e voltar à atualização automática. A sincronização é conduzida por um único mestre ativo e não altera compêndios em massa. Flags antigas são preservadas ao desativar o módulo.

Actors novos criados sem Bar Brawl registram apenas a procedência dos padrões nativos, quando não há configuração personalizada. Isso permite fornecer os recursos corretos caso o módulo seja ativado depois, sem migrar os documentos antigos indiscriminadamente.

Valide visualmente nas duas gerações, com Bar Brawl ausente, desativado e ativo: hover, nome, zoom, tokens vinculados e não vinculados, ameaças com proprietário jogador, clientes com permissões distintas, edição pelo HUD, efeitos sobre máximos, cenas fechadas e troca de regra. Testes unitários não substituem essa validação do canvas.

Os testes opcionais de referência aceitam `ORDEM_FOUNDRY_REFERENCE` apontando para `resources/app` de uma instalação Foundry v14. Eles leem seus utilitários para verificar atualização e exclusão de flags, sem modificar a instalação. Sem essa variável, são ignorados explicitamente. A suite Quench **OP | Token resources** valida documentos reais dentro do Foundry.

## Contribuidores

- Agradecimento ao <a href="https>//twitter.com/ciconiaborns">@jojo</a> pelas traduções do sistema para o Inglês.
- Agradacimento ao <strong>Dzeta (de discord: arcojin): </strong>
  tradução e adaptação do sistema para o Inglês;
- Agradacimento ao <strong>Marcos Miranda (de discord: .nyazi): </strong>
  vetorização e criação de ícones para compêndio.
- Agradacimento ao <strong>Gyoko (de discord: fuckpatyo): </strong>
  grandes contribuições no desenvolvimento da ficha de ameaças.
- Agradacimento a <strong>Fresko (de discord: jojoexperiencia): </strong>
  contribuiu enormemente na criação dos compêndios.
- Agradacimento ao <strong>Fabrício (de discord: fabricio): </strong>
  automatização do sistema de combate, melhrorias gerais e correções de bugs.
- Agradacimento ao <strong>Mercy (de discord: notnanomercy): </strong>
  melhorias gerais no sistema e correções de bugs. Criador do módulo Paranormal Toolkit, com automatizações e melhorias no sistema.

## Demonstração do Sistema

https://github.com/user-attachments/assets/ae649c77-42df-4e1d-ae8f-e8989f570f05

## Licenças e Observações.

<sub>
Este repositório utiliza <a href="https://semver.org/lang/pt-BR/">Versionamento Semântico 2.0</a>, <a href="https://www.conventionalcommits.org/en/v1.0.0/">Conventional Commits</a> e o guia de estilo para <a href="https://google.github.io/styleguide/jsguide.html">ESLint do Google</a>, além disso, desenvolvido com muita dedicação e código. Se precisar, contate-me através do e-mail ou redes sociais: <a href="https://mail.google.com/mail/u/0/?fs=1&to=souowendel@gmail.com&su=Enquiry&tf=cm">souowendel@gmail.com</a>, discord: souowendel, twitter: <a href="https://twitter.com/EuSouOWendel">eusouowendel</a><br><br>
</sub>
<sub>
This work is permitted under the <a href="https://github.com/SouOWendel/ordemparanormal_fvtt/blob/main/media/OGLlicense.txt">Open Gaming License</a>, the software component of this module/system is distributed under the <a href="https://github.com/SouOWendel/ordemparanormal_fvtt/blob/main/LICENSE.txt">CC BY-NC-SA 4.0 license</a>. Sistema Ordem Paranormal para FoundryVTT © 2026 by Wendel Henrique is licensed under <a href="https://github.com/SouOWendel/ordemparanormal_fvtt/blob/main/LICENSE.txt">CC BY-NC-SA 4.0</a><br><br>
</sub>
<sub>
¹: LANGE, R. Ordem Paranormal RPG. 1a EDIÇÃO ed. Rua Coronel Genuíno, 209 • Porto Alegre, rs: Jambô Editora, 2022. v. 1p. 2, 318. "O material a seguir é Identidade do Produto: os capítulos 5, 7 e 8, todos os termos referentes ao cenário de Ordem Paranormal, incluindo a Membrana, o Outro Lado, nomes e descrições de personagens, criaturas, entidades, lugares e organizações, todas as ilustrações e todas as regras de rituais, poderes paranormais, Sanidade e dano mental. O material a seguir é Conteúdo Open Game: todo o texto de regras do livro, exceto por material previamente declarado Identidade do Produto."<br><br>
</sub>
<sub>
Observação: A marca Ordem Paranormal não é de minha autoria, todos os direitos são reservados aos seus respectivos donos.
</sub>

<!-- Links Uteis -->
<!-- https://foundryvtt.wiki/en/development/guides/SD-tutorial -->
<!-- https://foundryvtt.com/article/dice-advanced/ -->
<!-- https://foundryvtt.wiki/en/development/guides/System-Development-for-Beginners/System-Development-Part-5-Wandering-in-000000 -->
<!-- https://foundryvtt.wiki/en/development/guides/vite -->
<!-- https://foundryvtt.wiki/en/development/guides/builtin-css -->
