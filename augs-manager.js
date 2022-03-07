import {
  formatMoney,
  formatNumber,
  formatPercent,
} from '/util-formatters.js';
import {
  sortCaseInsensitiveAlphabetical
} from '/util-helpers.js';



/**
 * Augmentation stats
 * 
 * Tags:
 *
 *  - hacking
 *  - combat
 *  - faction
 *  - company
 *  - crime
 *  - utility
 * @property {Object[]} augs
 */
const augs = [
  { name: 'ADR-V1 Pheromone Gene', tags: ['faction', 'company'] },
  { name: 'ADR-V2 Pheromone Gene', tags: ['faction', 'company'] },
  { name: 'Artificial Bio-neural Network Implant', tags: ['hacking'] },
  { name: 'Artificial Synaptic Potentiation', tags: ['hacking'] },
  { name: 'Augmented Targeting I', tags: ['combat'] },
  { name: 'Augmented Targeting II', tags: ['combat'] },
  { name: 'Augmented Targeting III', tags: ['combat'] },
  { name: 'Bionic Arms', tags: ['combat'] },
  { name: 'Bionic Legs', tags: ['combat'] },
  { name: 'Bionic Spine', tags: ['combat'] },
  { name: 'BitRunners Neurolink', programs: ['FTPCrack.exe', 'relaySMTP.exe'], tags: ['hacking'] },
  { name: 'BitWire', tags: [] },
  { name: 'BrachiBlades', tags: [] },
  { name: 'CashRoot Starter Kit', programs: ['BruteSSH.exe'], startingMoney: 1000000, tags: [] },
  { name: 'Combat Rib I', tags: [] },
  { name: 'Combat Rib II', tags: [] },
  { name: 'Combat Rib III', tags: [] },
  { name: 'CordiARC Fusion Reactor', tags: [] },
  { name: 'Cranial Signal Processors - Gen I', tags: [] },
  { name: 'Cranial Signal Processors - Gen II', tags: [] },
  { name: 'Cranial Signal Processors - Gen III', tags: [] },
  { name: 'Cranial Signal Processors - Gen IV', tags: [] },
  { name: 'Cranial Signal Processors - Gen V', tags: [] },
  { name: 'CRTX42-AA Gene Modification', tags: [] },
  { name: 'DataJack', tags: [] },
  { name: 'DermaForce Particle Barrier', tags: [] },
  { name: 'ECorp HVMind Implant', tags: [] },
  { name: 'Embedded Netburner Module Analyze Engine', tags: [] },
  { name: 'Embedded Netburner Module Core Implant', tags: [] },
  { name: 'Embedded Netburner Module Core V2 Upgrade', tags: [] },
  { name: 'Embedded Netburner Module Core V3 Upgrade', tags: [] },
  { name: 'Embedded Netburner Module Direct Memory Access Upgrade', tags: [] },
  { name: 'Embedded Netburner Module', tags: [] },
  { name: 'Enhanced Myelin Sheathing', tags: [] },
  { name: 'Enhanced Social Interaction Implant', tags: [] },
  { name: 'FocusWire', tags: [] },
  { name: 'Graphene Bionic Arms Upgrade', tags: [] },
  { name: 'Graphene Bionic Legs Upgrade', tags: [] },
  { name: 'Graphene Bionic Spine Upgrade', tags: [] },
  { name: 'Graphene Bone Lacings', tags: [] },
  { name: 'Graphene BrachiBlades Upgrade', tags: [] },
  { name: 'Hacknet Node Cache Architecture Neural-Upload', tags: [] },
  { name: 'Hacknet Node Core Direct-Neural Interface', tags: [] },
  { name: 'Hacknet Node CPU Architecture Neural-Upload', tags: [] },
  { name: 'Hacknet Node Kernel Direct-Neural Interface', tags: [] },
  { name: 'Hacknet Node NIC Architecture Neural-Upload', tags: [] },
  { name: 'HemoRecirculator', tags: [] },
  { name: 'Hydroflame Left Arm', tags: [] },
  { name: 'HyperSight Corneal Implant', tags: [] },
  { name: 'INFRARET Enhancement', tags: [] },
  { name: 'LuminCloaking-V1 Skin Implant', tags: [] },
  { name: 'LuminCloaking-V2 Skin Implant', tags: [] },
  { name: 'Nanofiber Weave', tags: [] },
  { name: 'NEMEAN Subdermal Weave', tags: [] },
  { name: 'Neotra', tags: [] },
  { name: 'Neural Accelerator', tags: [] },
  { name: 'Neural-Retention Enhancement', tags: [] },
  { name: 'Neuralstimulator', tags: [] },
  { name: 'Neuregen Gene Modification', tags: [] },
  { name: 'Neuronal Densification', tags: [] },
  { name: 'Neuroreceptor Management Implant', specialEffect: 'Removes the penalty for not focusing on actions such as working in a job or working for a faction', tags: [] },
  { name: 'Neurotrainer I', tags: [] },
  { name: 'Neurotrainer II', tags: [] },
  { name: 'Neurotrainer III', tags: [] },
  { name: 'NeuroFlux Governor'}, // Each level of this augmentation increases MOST multipliers by 1%, stacking multiplicatively.
  { name: 'nextSENS Gene Modification', tags: [] },
  { name: 'Nuoptimal Nootropic Injector Implant', tags: [] },
  { name: 'NutriGen Implant', tags: [] },
  { name: 'OmniTek InfoLoad', tags: [] },
  { name: 'PC Direct-Neural Interface NeuroNet Injector', tags: [] },
  { name: 'PC Direct-Neural Interface Optimization Submodule', tags: [] },
  { name: 'PC Direct-Neural Interface', tags: [] },
  { name: 'PCMatrix', programs: ['DeepscanV1.exe', 'AutoLink.exe'], tags: [] },
  { name: 'Photosynthetic Cells', tags: [] },
  { name: 'Power Recirculation Core', tags: [] },
  { name: 'QLink', tags: [] },
  { name: 'SmartJaw', tags: [] },
  { name: 'SmartSonar Implant', tags: [] },
  { name: 'Social Negotiation Assistant (S.N.A)', tags: [] },
  { name: 'Speech Enhancement', tags: [] },
  { name: 'Speech Processor Implant', tags: [] },
  { name: 'SPTN-97 Gene Modification', tags: [] },
  { name: 'Synaptic Enhancement Implant', tags: [] },
  { name: 'Synfibril Muscle', tags: [] },
  { name: 'Synthetic Heart', tags: [] },
  { name: 'The Black Hand', tags: [] },
  { name: 'The Shadow\'s Simulacrum', tags: [] },
  { name: 'TITN-41 Gene-Modification Injection', tags: [] },
  { name: 'Unstable Circadian Modulator', tags: [] },
  { name: 'Wired Reflexes', tags: [] },
  { name: 'Xanipher', tags: [] },
];

/**
 * @type {NS} ns Namespace.
 */
let ns;

/**
 * @param {NS} _ns Namespace
 **/
export async function main(_ns) {
  ns = _ns;

  const player = ns.getPlayer();
  const obtainableAugs = [];
  const canAlmostBuyAugs = [];
  const factionAugmentations = [];

  for (const faction of player.factions) {
    factionAugmentations.push(...ns.getAugmentationsFromFaction(faction)
      .map(augName => new FactionAugmentation({ns, name: augName, faction})));

    const factionAugs = ns.getAugmentationsFromFaction(faction)
      .map(augName => {
        const aug = augs.find(aug => aug.name === augName);
        const mults = ns.getAugmentationStats(augName);

        if (!aug) {
          ns.tprint(`cannot find entry for aug ${augName}`);
        }

        return {
          name: augName,
          faction,
          price: ns.getAugmentationPrice(augName),
          repReq: ns.getAugmentationRepReq(augName),
          prereqs: ns.getAugmentationPrereq(augName),
          mults,
          description: aug && generateStatsDescription(mults, aug.programs || null, aug.startingMoney || null, aug.specialEffect)
        }
      });

    const canBuyAugs = factionAugs.filter(aug => canBuyAugmentation(aug, faction));

    if (canBuyAugs.length) {
      obtainableAugs.push(...canBuyAugs);
    }

    const canAlmostBuyFactionAugs = factionAugs.filter(aug => canAlmostBuyAugmentation(aug, faction, 0.8));

    if (canAlmostBuyFactionAugs.length) {
      canAlmostBuyAugs.push(...canAlmostBuyFactionAugs);
    }
  }
  
  if (obtainableAugs.length) {
    obtainableAugs.sort((augA, augB) => augB.price - augA.price);

    ns.tprint('');
    ns.tprint('We can buy these augs:');
    for (let i = 0; i < obtainableAugs.length; i++) {
      const aug = obtainableAugs[i];
      ns.tprint(`(${String.prototype.padStart.call(i, 3, ' ')}) ${aug.name} @ ${aug.faction} for ${formatMoney(aug.price)}`);
    }
  }

  if (canAlmostBuyAugs.length) {
    canAlmostBuyAugs.sort((augA, augB) => augB.price - augA.price);

    ns.tprint('');
    ns.tprint('We can *almost* buy these augs:');
    for (let i = 0; i < canAlmostBuyAugs.length; i++) {
      const aug = canAlmostBuyAugs[i];
      ns.tprint(`(${String.prototype.padStart.call(i, 3, ' ')}) ${aug.name} @ ${aug.faction} for ${formatMoney(aug.price)} at ${formatNumber(aug.repReq)} rep`);
    }
  }

  // let name = 'NeuroFlux Governor';
  // let aug = {
  //   name,
  //   faction: 'any faction (except gang)',
  //   price: ns.getAugmentationPrice(name),
  //   repReq: ns.getAugmentationRepReq(name)
  // };
  // ns.tprint(`NeuroFlux Governor @ ${aug.faction} for ${formatMoney(aug.price)} at ${formatNumber(aug.repReq)} rep`);
  for (const aug of factionAugmentations) {
    ns.tprint(`${aug.name} @ ${aug.faction} for ${formatMoney(aug.price)} at ${formatNumber(aug.repReq)} rep (${aug.description.join(', ')})`);
  }
}

function canBuyAugmentation(aug, faction) {
  const player = ns.getPlayer();
  const playerAugs = ns.getOwnedAugmentations(true);

  // We can buy this aug when...
  const canBuy = !playerAugs.includes(aug.name) && // we don't already have it,
    (player.money >= aug.price) && // we can afford it,
    (ns.getFactionRep(faction) >= aug.repReq) && // we have enough repuration
    aug.prereqs.every(prereq => playerAugs.includes(prereq)); // and we have all prereq. augs.

  // if (!canBuy && !playerAugs.includes(aug.name)) {
  //   const reasons = [];

  //   if (player.money < aug.price) {
  //     reasons.push(`too expensive (${player.money} < ${aug.price})`);
  //   }
  //   if (ns.getFactionRep(faction) < aug.repReq) {
  //     reasons.push(`not enough rep (${ns.getFactionRep(faction)} < ${aug.repReq})`);
  //   }
  //   if (!aug.prereqs.every(prereq => playerAugs.includes(prereq))) {
  //     reasons.push(`prereqs not met (${aug.prereqs.join(', ')})`);
  //   }

  //   ns.tprint(`Cannot buy ${aug.name}: ${reasons.join('; ')}`);
  // }

  return canBuy;
}

function canAlmostBuyAugmentation(aug, faction, factor = 0.8) {
  const player = ns.getPlayer();
  const playerAugs = ns.getOwnedAugmentations(true);

  // We can buy this aug when...
  const canAlmostBuy = !playerAugs.includes(aug.name) && // we don't already have it,
    (
        ((player.money < aug.price) && (player.money >= (aug.price * factor))) || // we can afford it,
        ((ns.getFactionRep(faction) < aug.repReq) && (ns.getFactionRep(faction) >= (aug.repReq * factor)))
    ) && // we have enough repuration
    aug.prereqs.every(prereq => playerAugs.includes(prereq)); // and we have all prereq. augs.

  // if (!playerAugs.includes(aug.name) && !canAlmostBuy && !canBuyAugmentation(aug, faction)) {
  //   const reasons = [];

  //   if (player.money < (aug.price * factor)) {
  //     reasons.push(`way too expensive (${formatMoney(player.money)} < ${formatMoney(aug.price)} (${formatPercent(player.money / aug.price)}))`);
  //   }
  //   if (ns.getFactionRep(faction) < (aug.repReq * factor)) {
  //     reasons.push(`need a lot more rep from ${faction} (${formatNumber(ns.getFactionRep(faction))} < ${formatNumber(aug.repReq)} (${formatPercent(ns.getFactionRep(faction) / aug.repReq)}))`);
  //   }
  //   if (!aug.prereqs.every(prereq => playerAugs.includes(prereq))) {
  //     reasons.push(`prereqs not met (${aug.prereqs.join(', ')})`);
  //   }

  //   if (reasons.length) {
  //     ns.tprint(`Cannot buy ${aug.name} from ${faction}: ${reasons.join('; ')}`);
  //   } else {
  //     ns.tprint(`Cannot buy ${aug.name} from ${faction} - price: ${formatMoney(aug.price)}, repReq: ${formatNumber(aug.repReq)}, prereqs: ${aug.prereqs.join(', ')}`);
  //   }
  // }

  return canAlmostBuy;
}

/**
 * Generates a list of stat descriptions for an augmentation.
 * 
 * This method is based on https://github.com/danielyxie/bitburner/blob/dev/src/Augmentation/Augmentation.tsx
 * @param {Object} mults An object holding the stat multiplier values.
 * @param {string[]} programs Array of programs the augmentation provides the player with at start.
 * @param {number} startingMoney The amount of starting money the augmentation provides the player with.
 * @param {string} specialEffect An additional special effect.
 * @returns {string[]} augmentation stat descriptions
 */
function generateStatsDescription(mults, programs, startingMoney, specialEffect) {
  let desc = [];

  if (
    mults.hacking_mult &&
    mults.hacking_mult == mults.strength_mult &&
    mults.hacking_mult == mults.defense_mult &&
    mults.hacking_mult == mults.dexterity_mult &&
    mults.hacking_mult == mults.agility_mult &&
    mults.hacking_mult == mults.charisma_mult
  ) {
    desc.push(`+${formatPercent(mults.hacking_mult - 1)} all skills`);
  } else {
    if (mults.hacking_mult) {
      desc.push(`+${formatPercent(mults.hacking_mult - 1)} hacking skill`);
    }

    if (
      mults.strength_mult &&
      mults.strength_mult == mults.defense_mult &&
      mults.strength_mult == mults.dexterity_mult &&
      mults.strength_mult == mults.agility_mult
    ) {
      desc.push(`+${formatPercent(mults.strength_mult - 1)} combat skills`);
    } else {
      if (mults.strength_mult) {
        desc.push(`+${formatPercent(mults.strength_mult - 1)} strength skill`);
      }
      if (mults.defense_mult) {
        desc.push(`+${formatPercent(mults.defense_mult - 1)} defense skill`);
      }
      if (mults.dexterity_mult) {
        desc.push(`+${formatPercent(mults.dexterity_mult - 1)} dexterity skill`);
      }
      if (mults.agility_mult) {
        desc.push(`+${formatPercent(mults.agility_mult - 1)} agility skill`);
      }
    }
    if (mults.charisma_mult) {
      desc.push(`+${formatPercent(mults.charisma_mult - 1)} Charisma skill`);
    }
  }

  if (
    mults.hacking_exp_mult &&
    mults.hacking_exp_mult === mults.strength_exp_mult &&
    mults.hacking_exp_mult === mults.defense_exp_mult &&
    mults.hacking_exp_mult === mults.dexterity_exp_mult &&
    mults.hacking_exp_mult === mults.agility_exp_mult &&
    mults.hacking_exp_mult === mults.charisma_exp_mult
  ) {
    desc.push(`+${formatPercent(mults.hacking_exp_mult - 1)} exp for all skills`);
  } else {
    if (mults.hacking_exp_mult) {
      desc.push(`+${formatPercent(mults.hacking_exp_mult - 1)} hacking exp`);
    }

    if (
      mults.strength_exp_mult &&
      mults.strength_exp_mult === mults.defense_exp_mult &&
      mults.strength_exp_mult === mults.dexterity_exp_mult &&
      mults.strength_exp_mult === mults.agility_exp_mult
    ) {
      desc.push(`+${formatPercent(mults.strength_exp_mult - 1)} combat exp`);
    } else {
      if (mults.strength_exp_mult) {
        desc.push(`+${formatPercent(mults.strength_exp_mult - 1)} strength exp`);
      }
      if (mults.defense_exp_mult) {
        desc.push(`+${formatPercent(mults.defense_exp_mult - 1)} defense exp`);
      }
      if (mults.dexterity_exp_mult) {
        desc.push(`+${formatPercent(mults.dexterity_exp_mult - 1)} dexterity exp`);
      }
      if (mults.agility_exp_mult) {
        desc.push(`+${formatPercent(mults.agility_exp_mult - 1)} agility exp`);
      }
    }
    if (mults.charisma_exp_mult) {
      desc.push(`+${formatPercent(mults.charisma_exp_mult - 1)} charisma exp`);
    }
  }

  if (mults.hacking_speed_mult) {
    desc.push(`+${formatPercent(mults.hacking_speed_mult - 1)} faster hack(), grow(), and weaken()`);
  }
  if (mults.hacking_chance_mult) {
    desc.push(`+${formatPercent(mults.hacking_chance_mult - 1)} hack() success chance`);
  }
  if (mults.hacking_money_mult) {
    desc.push(`+${formatPercent(mults.hacking_money_mult - 1)} hack() power`);
  }
  if (mults.hacking_grow_mult) {
    desc.push(`+${formatPercent(mults.hacking_grow_mult - 1)} grow() power`);
  }

  if (mults.faction_rep_mult && mults.faction_rep_mult === mults.company_rep_mult) {
    desc.push(`+${formatPercent(mults.faction_rep_mult - 1)} reputation from factions and companies`);
  } else {
    if (mults.faction_rep_mult) {
      desc.push(`+${formatPercent(mults.faction_rep_mult - 1)} reputation from factions`);
    }
    if (mults.company_rep_mult) {
      desc.push(`+${formatPercent(mults.company_rep_mult - 1)} reputation from companies`);
    }
  }

  if (mults.crime_money_mult) {
    desc.push(`+${formatPercent(mults.crime_money_mult - 1)} crime money`);
  }
  if (mults.crime_success_mult) {
    desc.push(`+${formatPercent(mults.crime_success_mult - 1)} crime success rate`);
  }
  if (mults.work_money_mult) {
    desc.push(`+${formatPercent(mults.work_money_mult - 1)} work money`);
  }

  if (mults.hacknet_node_money_mult) {
    desc.push(`+${formatPercent(mults.hacknet_node_money_mult - 1)} hacknet production`);
  }
  if (mults.hacknet_node_purchase_cost_mult) {
    desc.push(`-${formatPercent(-(mults.hacknet_node_purchase_cost_mult - 1))} hacknet nodes cost`);
  }
  if (mults.hacknet_node_level_cost_mult) {
    desc.push(`-${formatPercent(-(mults.hacknet_node_level_cost_mult - 1))} hacknet nodes upgrade cost`);
  }

  if (mults.bladeburner_max_stamina_mult) {
    desc.push(`+${formatPercent(mults.bladeburner_max_stamina_mult - 1)} Bladeburner Max Stamina`);
  }
  if (mults.bladeburner_stamina_gain_mult) {
    desc.push(`+${formatPercent(mults.bladeburner_stamina_gain_mult - 1)} Bladeburner Stamina gain`);
  }
  if (mults.bladeburner_analysis_mult) {
    desc.push(`+${formatPercent(mults.bladeburner_analysis_mult - 1)} Bladeburner Field Analysis effectiveness`);
  }
  if (mults.bladeburner_success_chance_mult) {
    desc.push(`+${formatPercent(mults.bladeburner_success_chance_mult - 1)} Bladeburner Contracts and Operations success chance`);
  }

  if (startingMoney) {
    desc.push(`Start with ${formatMoney(startingMoney)}`); // '...after installing Augmentations'
  }

  if (programs && programs.length) {
    desc.push(`Start with ${programs.join(' and ')}`); // '...after installing Augmentations'
  }

  if (specialEffect) {
    desc.push(specialEffect);
  }

  return desc;
}

class FactionAugmentation {
  /**
   * @property {Object} additionalAugStats Additional stats that we need but `NS.getAugmentationStats` doesn't provide us with.
   * @property {string[]} [additionalAugStats.programs] Array of programs the augmentation provides us with at start.
   * @property {number} additionalAugStats.startingMoney The amount of starting money the augmentation provides us with.
   * @property {string} additionalAugStats.specialEffect An additional special effect provided by this augmentation.
   * @property {boolean} additionalAugStats.hasLevels Whether or not this augmentation uses levels, i.e. can be leveled up. 
   * @static
   */
  static #additionalAugStats = {
    'BitRunners Neurolink': {
      programs: [
        'FTPCrack.exe',
        'relaySMTP.exe'
      ]
    },
    'CashRoot Starter Kit': {
      programs: [
        'BruteSSH.exe'
      ],
      startingMoney: 1000000
    },
    'Neuroreceptor Management Implant': {
      specialEffect: 'Removes the penalty for not focusing on actions such as working in a job or working for a faction'
    },
    'PCMatrix': {
      programs: [
        'DeepscanV1.exe',
        'AutoLink.exe'
      ]
    },
    'NeuroFlux Governor': {
      hasLevels: true
    }
  };

  #ns;
  #name;
  #faction;
  #programs;
  #startingMoney;
  #specialEffect;
  #hasLevels;
  #description;

  /**
   * Create a new FactionAugmentation.
   * @param {Object} config Configuration.
   * @param {NS} config.ns Namespace.
   * @param {string} config.name Augmentation name.
   * @param {string} config.faction The faction that provides this augmentation.
   */
  constructor(config) {
    this.#ns = config.ns;
    this.#name = config.name;
    this.#faction = config.faction;

    const moreStats = FactionAugmentation.#additionalAugStats[this.#name];

    this.#programs = moreStats?.programs ? [...moreStats.programs] : [];
    this.#startingMoney = moreStats?.startingMoney || null;
    this.#specialEffect = moreStats?.specialEffect || null;
    this.#hasLevels = !!moreStats?.hasLevels;
  }

  /**
   * @property {string} name The name of the augmentation.
   */
  get name() {
    return this.#name;
  }

  /**
   * @property {string} faction The faction that provides this augmentation.
   */
  get faction() {
    return this.#faction;
  }

  /**
   * @property {Object} An object holding the stat multiplier values.
   */
  get mults() {
    return this.#ns.getAugmentationStats(this.#name);
  }

  /**
   * @property {number} price How much the augmentation costs.
   */
  get price() {
    return this.#ns.getAugmentationPrice(this.#name);
  }

  /**
   * @property {number} repReq How much repuration is required to buy this augmentation.
   */
  get repReq() {
    return this.#ns.getAugmentationRepReq(this.#name);
  }

  /**
   * @property {string[]} prereqs The augmentations we're required to have before we can buy this one.
   */
  get prereqs() {
    return this.#ns.getAugmentationPrereq(this.#name);
  }

  /**
   * @property {string[]} Array of programs the augmentation provides us with at start.
   */
  get programs() {
    return [...this.#programs];
  }

  /**
   * @property {number} The amount of starting money the augmentation provides us with.
   */
  get startingMoney() {
    return this.#startingMoney;
  }

  /**
   * @property {string} An additional special effect provided by this augmentation.
   */
  get specialEffect() {
    return this.#specialEffect;
  }

  /**
   * @property {boolean} Whether or not this augmentation uses levels, i.e. can be leveled up.
   */
  get hasLevels() {
    return this.#hasLevels;
  }

  /**
   * Whether or not we own this augmentation.
   * 
   * Note that this augmentation could have been bought but not installed yet.
   * @property {boolean} isOwned
   */
  get isOwned() {
    return this.#ns.getOwnedAugmentations(true).includes(this.#name);
  }

  /**
   * @property {boolean} haveEnoughRep Whether or not we have enough repuration to buy this augmentation from this faction.
   */
  get haveEnoughRep() {
    return this.repReq <= this.#ns.getFactionRep(this.#faction);
  }

  /**
   * @property {boolean} canAfford Whether or not we have enough money to buy this augmentation.
   */
  get canAfford() {
    return this.price <= this.#ns.getPlayer().money;
  }

  /**
   * @property {string[]} A list of stat descriptions for this augmentation.
   */
  get description() {
    return this.#description || (this.#description = this.generateStatsDescription()); // Init and cache on first get.
  }

  /**
   * Generates a list of stat descriptions for an augmentation.
   * 
   * This method is based on https://github.com/danielyxie/bitburner/blob/dev/src/Augmentation/Augmentation.tsx
   * @returns {string[]} augmentation stat descriptions
   */
  generateStatsDescription() {
    const mults = this.mults;
    let desc = [];

    if (
      mults.hacking_mult &&
      mults.hacking_mult == mults.strength_mult &&
      mults.hacking_mult == mults.defense_mult &&
      mults.hacking_mult == mults.dexterity_mult &&
      mults.hacking_mult == mults.agility_mult &&
      mults.hacking_mult == mults.charisma_mult
    ) {
      desc.push(`+${formatPercent(mults.hacking_mult - 1)} all skills`);
    } else {
      if (mults.hacking_mult) {
        desc.push(`+${formatPercent(mults.hacking_mult - 1)} hacking skill`);
      }

      if (
        mults.strength_mult &&
        mults.strength_mult == mults.defense_mult &&
        mults.strength_mult == mults.dexterity_mult &&
        mults.strength_mult == mults.agility_mult
      ) {
        desc.push(`+${formatPercent(mults.strength_mult - 1)} combat skills`);
      } else {
        if (mults.strength_mult) {
          desc.push(`+${formatPercent(mults.strength_mult - 1)} strength skill`);
        }
        if (mults.defense_mult) {
          desc.push(`+${formatPercent(mults.defense_mult - 1)} defense skill`);
        }
        if (mults.dexterity_mult) {
          desc.push(`+${formatPercent(mults.dexterity_mult - 1)} dexterity skill`);
        }
        if (mults.agility_mult) {
          desc.push(`+${formatPercent(mults.agility_mult - 1)} agility skill`);
        }
      }
      if (mults.charisma_mult) {
        desc.push(`+${formatPercent(mults.charisma_mult - 1)} Charisma skill`);
      }
    }

    if (
      mults.hacking_exp_mult &&
      mults.hacking_exp_mult === mults.strength_exp_mult &&
      mults.hacking_exp_mult === mults.defense_exp_mult &&
      mults.hacking_exp_mult === mults.dexterity_exp_mult &&
      mults.hacking_exp_mult === mults.agility_exp_mult &&
      mults.hacking_exp_mult === mults.charisma_exp_mult
    ) {
      desc.push(`+${formatPercent(mults.hacking_exp_mult - 1)} exp for all skills`);
    } else {
      if (mults.hacking_exp_mult) {
        desc.push(`+${formatPercent(mults.hacking_exp_mult - 1)} hacking exp`);
      }

      if (
        mults.strength_exp_mult &&
        mults.strength_exp_mult === mults.defense_exp_mult &&
        mults.strength_exp_mult === mults.dexterity_exp_mult &&
        mults.strength_exp_mult === mults.agility_exp_mult
      ) {
        desc.push(`+${formatPercent(mults.strength_exp_mult - 1)} combat exp`);
      } else {
        if (mults.strength_exp_mult) {
          desc.push(`+${formatPercent(mults.strength_exp_mult - 1)} strength exp`);
        }
        if (mults.defense_exp_mult) {
          desc.push(`+${formatPercent(mults.defense_exp_mult - 1)} defense exp`);
        }
        if (mults.dexterity_exp_mult) {
          desc.push(`+${formatPercent(mults.dexterity_exp_mult - 1)} dexterity exp`);
        }
        if (mults.agility_exp_mult) {
          desc.push(`+${formatPercent(mults.agility_exp_mult - 1)} agility exp`);
        }
      }
      if (mults.charisma_exp_mult) {
        desc.push(`+${formatPercent(mults.charisma_exp_mult - 1)} charisma exp`);
      }
    }

    if (mults.hacking_speed_mult) {
      desc.push(`+${formatPercent(mults.hacking_speed_mult - 1)} faster hack(), grow(), and weaken()`);
    }
    if (mults.hacking_chance_mult) {
      desc.push(`+${formatPercent(mults.hacking_chance_mult - 1)} hack() success chance`);
    }
    if (mults.hacking_money_mult) {
      desc.push(`+${formatPercent(mults.hacking_money_mult - 1)} hack() power`);
    }
    if (mults.hacking_grow_mult) {
      desc.push(`+${formatPercent(mults.hacking_grow_mult - 1)} grow() power`);
    }

    if (mults.faction_rep_mult && mults.faction_rep_mult === mults.company_rep_mult) {
      desc.push(`+${formatPercent(mults.faction_rep_mult - 1)} reputation from factions and companies`);
    } else {
      if (mults.faction_rep_mult) {
        desc.push(`+${formatPercent(mults.faction_rep_mult - 1)} reputation from factions`);
      }
      if (mults.company_rep_mult) {
        desc.push(`+${formatPercent(mults.company_rep_mult - 1)} reputation from companies`);
      }
    }

    if (mults.crime_money_mult) {
      desc.push(`+${formatPercent(mults.crime_money_mult - 1)} crime money`);
    }
    if (mults.crime_success_mult) {
      desc.push(`+${formatPercent(mults.crime_success_mult - 1)} crime success rate`);
    }
    if (mults.work_money_mult) {
      desc.push(`+${formatPercent(mults.work_money_mult - 1)} work money`);
    }

    if (mults.hacknet_node_money_mult) {
      desc.push(`+${formatPercent(mults.hacknet_node_money_mult - 1)} hacknet production`);
    }
    if (mults.hacknet_node_purchase_cost_mult) {
      desc.push(`-${formatPercent(-(mults.hacknet_node_purchase_cost_mult - 1))} hacknet nodes cost`);
    }
    if (mults.hacknet_node_level_cost_mult) {
      desc.push(`-${formatPercent(-(mults.hacknet_node_level_cost_mult - 1))} hacknet nodes upgrade cost`);
    }

    if (mults.bladeburner_max_stamina_mult) {
      desc.push(`+${formatPercent(mults.bladeburner_max_stamina_mult - 1)} Bladeburner Max Stamina`);
    }
    if (mults.bladeburner_stamina_gain_mult) {
      desc.push(`+${formatPercent(mults.bladeburner_stamina_gain_mult - 1)} Bladeburner Stamina gain`);
    }
    if (mults.bladeburner_analysis_mult) {
      desc.push(`+${formatPercent(mults.bladeburner_analysis_mult - 1)} Bladeburner Field Analysis effectiveness`);
    }
    if (mults.bladeburner_success_chance_mult) {
      desc.push(`+${formatPercent(mults.bladeburner_success_chance_mult - 1)} Bladeburner Contracts and Operations success chance`);
    }

    if (this.startingMoney) {
      desc.push(`Start with ${formatMoney(this.startingMoney)}`); // '...after installing Augmentations'
    }

    if (this.programs && this.programs.length) {
      desc.push(`Start with ${this.programs.join(' and ')}`); // '...after installing Augmentations'
    }

    if (this.specialEffect) {
      desc.push(this.specialEffect);
    }

    return desc;
  }
}