/* eslint-disable no-unused-vars */
import {
	onManageActiveEffect,
	prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class OrdemActorSheet extends ActorSheet {
	// TODO: escolher um novo tamanho em height para a ficha de ator, é melhor para acomodação em resoluções mais baixas.

	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['ordemparanormal', 'sheet', 'actor'],
			template: 'systems/ordemparanormal/templates/actor/actor-sheet.html',
			width: 600,
			height: 820,
			tabs: [
				{
					navSelector: '.sheet-tabs',
					contentSelector: '.sheet-body',
					initial: 'features',
				},
			],
		});
	}

	/** @override */
	get template() {
		return `systems/ordemparanormal/templates/actor/actor-${this.actor.data.type}-sheet.html`;
	}

	/* -------------------------------------------- */

	/** @override */
	getData() {
		// Retrieve the data structure from the base sheet. You can inspect or log
		// the context variable to see the structure, but some key properties for
		// sheets are the actor object, the data object, whether or not it's
		// editable, the items array, and the effects array.
		const context = super.getData();
	
		// Use a safe clone of the actor data for further operations.
		const actorData = this.actor.data.toObject(false);

		// Add the actor's data to context.data for easier access, as well as flags.
		context.data = actorData.data;
		context.flags = actorData.flags;

		// Dropdown
		context.optionDegree = CONFIG.ordemparanormal.dropdownDegree;
		context.optionClass = CONFIG.ordemparanormal.dropdownClass;
		context.optionTrilhas = CONFIG.ordemparanormal.dropdownTrilha;
		context.optionOrigins = CONFIG.ordemparanormal.dropdownOrigins;
		// CONFIG.ActiveEffect.legacyTransferral = true;

		// Prepara os dados do Agente e seus Items.
		if (actorData.type == 'agent') {
			this._prepareItems(context);
			this._prepareAgentData(context);
			this._prepareItemsDerivedData(context);
			this._prepareActorSpaces(context);
		}

		// Add roll data for TinyMCE editors.
		context.rollData = context.actor.getRollData();

		// Prepare active effects
		context.effects = prepareActiveEffectCategories(this.actor.effects);

		// TODO: terminar a migração dos efeitos de itens para efeitos de ator e exclusão de itens não validos da ficha de ator.
		// for (const i of context.items) {
		// 	console.log(i);
		// }
		// console.log(context.effects);
		// console.log(context.data.spaces);

		return context;
	}

	/**
	 * Organiza e classifica os items para Planilha de Personagem.
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	_prepareAgentData(context) {

		// Acesso Rápido
		const NEX = context.data.NEX.value;
		const AGI = context.data.attributes.dex.value;
		const VIG = context.data.attributes.vit.value;
		const FOR = context.data.attributes.str.value;
		const INT = context.data.attributes.int.value;
		const PRE = context.data.attributes.pre.value;
		const DEFESA = context.data.defense.value;
		const REFLEXES = context.data.skills.reflexes;

		// DEFESA E ESQUIVA
		context.data.defense.value += AGI;
		console.log(typeof context.data.defense.dodge, context.data.defense.dodge);
		console.log(typeof context.data.defense.value, context.data.defense.value);
		console.log(typeof REFLEXES.value, REFLEXES.value);
		console.log(typeof REFLEXES.mod, REFLEXES.mod);
		context.data.defense.dodge = context.data.defense.value + REFLEXES.value + (REFLEXES.mod || 0);

		// NEX
		const calcNEX = (NEX < 99) ? Math.floor(NEX / 5) : 20;
		const nexAdjust = calcNEX-1; 
		const nexIf = calcNEX > 1;

		// PE / RODADA
		context.data.PE.perRound = calcNEX;

		// DEFININDO STATUS CONFORME A CLASSE

		// Resolvendo incompatibilidade com classes (será retirado futuramente)
		if (context.data.class == 'Combatente') context.data.class == 'fighter';
		else if (context.data.class == 'Especialista') context.data.class == 'specialist';
		else if (context.data.class == 'Ocultista') context.data.class == 'occultist';

		if (context.data.class == 'fighter') {
			context.data.PV.max = (20 + VIG) + ((nexIf) && nexAdjust * (4 + VIG));
			context.data.PE.max = (2 + PRE) + ((nexIf) && nexAdjust * (2 + PRE));
			context.data.SAN.max = (12) + ((nexIf) && nexAdjust * 3);
		} else if (context.data.class == 'specialist') {
			context.data.PV.max = (16 + VIG) + ((nexIf) && nexAdjust * (3 + VIG));
			context.data.PE.max = (3 + PRE) + ((nexIf) && nexAdjust * (3 + PRE));
			context.data.SAN.max = (16) + ((nexIf) && nexAdjust * 4);
		} else if (context.data.class == 'occultist') {
			context.data.PV.max = (12 + VIG) + ((nexIf) && nexAdjust * (2 + VIG));
			context.data.PE.max = (4 + PRE) + ((nexIf) && nexAdjust * (4 + PRE));
			context.data.SAN.max = (20) + ((nexIf) && nexAdjust * 5);
		} else {
			context.data.PV.max = context.data.PV.max || 0;
			context.data.PE.max = context.data.PE.max || 0;
			context.data.SAN.max = context.data.SAN.max || 0;
		}

		// Adicionando os bônus as respectivas variáveis
		context.data.PV.max += context.data.PV.maxBonus;
		context.data.PE.max += context.data.PE.maxBonus;
		context.data.SAN.max += context.data.SAN.maxBonus;
		context.data.attributes.str.value += context.data.attributes.str.bonus;
		context.data.attributes.vit.value += context.data.attributes.vit.bonus;
		context.data.attributes.dex.value += context.data.attributes.dex.bonus;
		context.data.attributes.int.value += context.data.attributes.int.bonus;
		context.data.attributes.pre.value += context.data.attributes.pre.bonus;

		/**
		 * Faz um loop das perícias e depois faz algumas verificações para definir a formula de rolagem,
		 * depois disso, salva o valor nas informações 
		 * */ 
		for (const [keySkill, skillsName] of Object.entries(context.data.skills)) {

			// Definindo constantes para acesso simplificado.
			const carga = skillsName.conditions.carga;
			const trained = skillsName.conditions.trained;

			// Formando o nome com base nas condições de carga e treino da perícia.
			skillsName.label =
				game.i18n.localize(CONFIG.ordemparanormal.skills[keySkill]) +
				((carga) ? '+' : (trained) ? '*' : '') ?? k;

			/** FORMULA DE ROLAGEM
			 * Criando o que vem antes e depois do D20 das perícias.
			 * beforeD20Formula: verifica se o atributo da perícia é 0 ou maior do que zero.
			 * 	Se (perícia) = 0: dois dados e pegue o menor valor;
			 * 	Se (perícia) > 0: simplemente atribua o valor.
			 * afterD20Formula: verifica se é preciso pegar o menor valor ou o maior valor das rolagens
			 * além disso, atribui a soma do resultado final.
			 * 	Se (perícia) = 0: pegue o MENOR valor como resultado;
			 * 	Se (perícia) > 0: pegue o MAIOR valor como resultado.
			 * */  
			const beforeD20Formula = 
				((skillsName.attr[1]) ? skillsName.attr[1] : 2);

			const afterD20Formula = 
				((skillsName.attr[1] != 0) ? 'kh' : 'kl') +
				((skillsName.value != 0) ? '+' + skillsName.value : '') +
				((skillsName.mod) ? '+' + skillsName.mod : '');

			skillsName.formula = beforeD20Formula + 'd20' + afterD20Formula;
		}
	}

	/**
	 * Organize and classify Items for Character sheets.
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	_prepareItems(context) {
		// Initialize containers.
		const gear = [];
		const features = [];

		const protection = [];
		const generalEquipment = [];
		const armament = [];
		const rituals = {
			valid: {
				1: [],
				2: [],
				3: [],
				4: [],	
			},
			invalid: []
		};
		const abilities = {
			valid: {
				1: [],
				2: [],
				3: [],	
			},
			invalid: []
		};

		// const invalid = [];
		
		// Iterate through items, allocating to containers
		for (const [index, i] of context.items.entries()) {
			i.img = i.img || DEFAULT_TOKEN;

			// Creating the data to use an item
			i.system.using = (!i.system.using) ? [true, 'fas'] : i.system.using;

			// Append to protections.
			if (i.type === 'protection') {
				protection.push(i);
			}
			// Append to general equipment.
			else if (i.type === 'generalEquipment') {
				generalEquipment.push(i);
			}
			// Append to armament.
			else if (i.type === 'armament') {
				armament.push(i);
			}
			// Append to gear.
			else if (i.type === 'item') {
				gear.push(i);
			}
			// Append to features.
			else if (i.type === 'feature') {
				features.push(i);
			}
			// Append to rituals.
			else if (i.type === 'ritual') {
				if (i.system.circle) rituals.valid[i.system.circle].push(i);
				else rituals.invalid.push(i);
			}
			// Append to abilities.
			else if (i.type === 'ability') {
				if (i.system.abilityType == 'ability') abilities.valid[1].push(i);
				else if (i.system.abilityType == 'class') abilities.valid[2].push(i);
				else if (i.system.abilityType == 'paranormal') abilities.valid[3].push(i);
				else if (!i.system.abilityType) abilities.invalid.push(i);
			}
		}

		// Assign and return
		context.gear = gear;
		context.features = features;

		context.rituals = rituals;
		context.protection = protection;
		context.generalEquip = generalEquipment;
		context.armament = armament;
		context.abilities = abilities;
	}

	/**
	 * Prepare and calcule the data of items
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	_prepareItemsDerivedData(context) {

		const items = context.items;
		for (const p of context.protection) {
			if (typeof p.system.defense == 'number' && p.system.using.state == true) {
				context.data.defense.value += p.system.defense;
			}
		}
	}

	/**
	 * Prepare and calcule the spaces of actors
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	_prepareActorSpaces(context) {
		const spaces = context.data.spaces ??= {};
		const FOR = context.data.attributes.str.value || 0;
		spaces.over, spaces.pctMax = 0;

		// Get the total weight from items
		const physicalItems = ['armament', 'generalEquipment', 'protection'];
		const weight = context.items.reduce((weight, i) => {
		  if ( !physicalItems.includes(i.type) ) return weight;
		  const q = i.system.quantity || 0;
		  const w = i.system.weight || 0;
		  return weight + (q * w);
		}, 0);

		// Populate the final values
		spaces.value = weight.toNearest(0.1);
		spaces.max = (FOR !== 0) ? FOR * 5 : 2;

		// Plus bonus
		spaces.value += spaces.bonus.value;
		spaces.max += spaces.bonus.max;

		spaces.pct = Math.clamped((spaces.value * 100) / spaces.max, 0, 100);

		// Apply the debuffs
		if (spaces.value > spaces.max) {
			spaces.over = spaces.value - spaces.max;
			context.data.desloc.value += -3;
			context.data.defense.value += -5;
			spaces.pctMax = Math.clamped((spaces.over * 100) / spaces.max, 0, 100);
		}
		if (spaces.value > (spaces.max * 2)) ui.notifications.warn(game.i18n.localize('WARN.overWeight'));
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Render the item sheet for viewing/editing prior to the editable check.
		html.find('.item-edit').click((ev) => {
			const li = $(ev.currentTarget).parents('.item');
			const item = this.actor.items.get(li.data('itemId'));
			item.sheet.render(true);
		});

		// -------------------------------------------------------------
		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		// Send description of item in chat
		html.find('.send-chat').click(this._onSendChat.bind(this));

		// Send description of item in chat
		html.find('.mark-item').click(this._onMarkItem.bind(this));

		// Add Inventory Item
		html.find('.item-create').click(this._onItemCreate.bind(this));

		// Delete Inventory Item
		html.find('.item-delete').click((ev) => {
			const li = $(ev.currentTarget).parents('.item');
			const item = this.actor.items.get(li.data('itemId'));
			item.delete();
			li.slideUp(200, () => this.render(false));
		});

		// Active Effect management
		html.find('.effect-control').click((ev) =>
			onManageActiveEffect(ev, this.actor),
		);

		// Rollable abilities.
		html.find('.rollable').click(this._onRoll.bind(this));

		// Drag events for macros.
		if (this.actor.isOwner) {
			const handler = (ev) => this._onDragStart(ev);
			html.find('li.item').each((i, li) => {
				if (li.classList.contains('inventory-header')) return;
				li.setAttribute('draggable', true);
				li.addEventListener('dragstart', handler, false);
			});
		}
	}

	/**
	 * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async _onItemCreate(event) {
		event.preventDefault();
		const header = event.currentTarget;
		// Get the type of item to create.
		const type = header.dataset.type;
		// Grab any data associated with this control.
		const data = duplicate(header.dataset);
		// Initialize a default name.
		const name = game.i18n.localize('ordemparanormal.newItem') + ' ' + game.i18n.localize('TYPES.Item.' + type);
		// Prepare the item object.
		const itemData = {
			name: name,
			type: type,
			data: data,
		};
		// Remove the type from the dataset since it's in the itemData.type prop.
		delete itemData.data['type'];

		// Finally, create the item!
		return await Item.create(itemData, { parent: this.actor });
	}

	/**
	 * Handle creating a new message with data of item for send to chat.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async _onSendChat(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		const itemId = element.closest('.item').dataset.itemId;
		const item = this.actor.items.get(itemId);

		if (item.system.description) ChatMessage.create({ content: item.system.description});
	}

	/**
	 * Handle marks an item whether it is used or not and changes the icon
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async _onMarkItem(event) {
		event.preventDefault();
		const element = event.target; // Puxa o elemento filho
		const dataset = event.currentTarget.dataset; // Dataset do elemento pai

		const itemId = event.currentTarget.closest('.item').dataset.itemId;
    	const item = this.actor.items.get(itemId);

		if (!item.system.using || item.system.using.state == false) {
			console.log(`OP FVTT | Definindo ${item.name} como ativado.`);
			return item.update({'system.using': {'state': true, 'class': 'fas'} });
		}
		else { 
			console.log(`OP FVTT | Definindo ${item.name} como desativado.`);
			return item.update({'system.using': {'state': false, 'class': 'far'} });
		}
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		// Handle item rolls.
		if (dataset.rollType) {
			if (dataset.rollType == 'item') {
				const itemId = element.closest('.item').dataset.itemId;
				const item = this.actor.items.get(itemId);
				if (item) return item.roll();
			}
		}

		// Handle rolls that supply the formula directly.
		if (dataset.roll) {
			const label = dataset.label ? `Rolando ${dataset.label}` : '';
			const roll = new Roll(dataset.roll, this.actor.getRollData());
			roll.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: label,
				rollMode: game.settings.get('core', 'rollMode'),
			});
			return roll;
		}
	}
}
