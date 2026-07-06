<div align="center">

<img src="https://github.com/SouOWendel/ordemparanormal-fvtt/blob/main/media/op-logo.png?raw=true" alt="logo do Ordem Paranormal">
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

Ordem Paranormal é um sistema e/ou universo de investigação paranormal criado por Rafael Lange, mais conhecido pelo seu pseudônimo Cellbit. Com base nisso, este é um **sistema não-oficial** adaptado para o FoundryVTT.

**Este é um conteúdo não oficial, publicado sob a [Licença da Comunidade de Ordem Paranormal](https://ordemparanormal.com.br/licenca).**

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
2. Ative os módulos **Quench** e **Bar Brawl** no mundo
3. Abra o painel do Quench na sidebar e clique **Run All**

As suites disponíveis:

- **OP | Agent Actor: prepareDerivedData** — classes, progressão, PV/PE/SAN, defesa, rituais, patentes
- **OP | Actor: Active Effects** — resolução de `@variáveis`, stacking, item-transferred AEs
- **OP | Item: isCritical & getRollData** — parsing de fórmulas críticas, dados de rolagem
- **OP | Sheets: registration & dataModels** — registro de sheets e TypeDataModels no CONFIG

## Modulos Obrigatórios.

- **Brawl Bar**: módulo utilizado para adicionar uma terceira barra nos tokens, complementando os principais status de personagem do Ordem Paranormal: Pontos de Vida (PV), Sanidade (San), Pontos de Esforço (PE);

## Contribuidores

- Agradecimento ao <a href="https://twitter.com/ciconiaborns">@jojo</a> pelas traduções do sistema para o Inglês.

## Demonstração do Sistema

https://github.com/user-attachments/assets/ae649c77-42df-4e1d-ae8f-e8989f570f05

## Licenças e Observações.

<sub>
Este repositório utiliza <a href="https://semver.org/lang/pt-BR/">Versionamento Semântico 2.0</a>, <a href="https://www.conventionalcommits.org/en/v1.0.0/">Conventional Commits</a> e o guia de estilo para <a href="https://google.github.io/styleguide/jsguide.html">ESLint do Google</a>, além disso, desenvolvido com muita dedicação e código. Se precisar, contate-me através do e-mail ou redes sociais: <a href="https://mail.google.com/mail/u/0/?fs=1&to=souowendel@gmail.com&su=Enquiry&tf=cm">souowendel@gmail.com</a>, discord: souowendel, twitter: <a href="https://twitter.com/EuSouOWendel">eusouowendel</a><br><br>
</sub>
<sub>
Licenciamento duplo: o <b>conteúdo</b> de universo e regras de Ordem Paranormal é distribuído sob a <a href="https://ordemparanormal.com.br/licenca">Licença da Comunidade de Ordem Paranormal v1.0</a> (ver <a href="https://github.com/SouOWendel/ordemparanormal_fvtt/blob/main/LICENSE-COMMUNITY.txt">LICENSE-COMMUNITY.txt</a>); o <b>componente de software</b> deste módulo/sistema (JavaScript, SCSS, templates) é distribuído sob a <a href="https://github.com/SouOWendel/ordemparanormal_fvtt/blob/main/LICENSE.txt">CC BY-NC-SA 4.0</a>. Sistema Ordem Paranormal para FoundryVTT © 2026 by Wendel Henrique.<br><br>
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
