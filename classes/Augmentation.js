/**
 * Enum of augmentation types.
 */
class AugmentationTags {
     static hacking = 'hacking';
     static combat = 'combat';
     static charisma = 'charisma';
     static hacknet = 'hacknet';
     static faction = 'faction';
     static company = 'company';
     static crime = 'crime';
     static bladeburner = 'bladeburner';
     static utility = 'utility';
}

/**
 * An Augmentation, which provides certain bonuses to the player.
 */
export default class Augmentation {
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
    #factions;
    #programs;
    #startingMoney;
    #specialEffect;
    #hasLevels;
    #tags;
    #description;

    /**
     * Create a new FactionAugmentation.
     * @param {Object} config Configuration.
     * @param {NS} config.ns Namespace.
     * @param {string} config.name Augmentation name.
     * @param {string[]} config.factions The factions that can provide this augmentation.
     */
    constructor(config) {
        this.#ns = config.ns;
        this.#name = config.name;
        this.#factions = config.factions;

        const moreStats = Augmentation.#additionalAugStats[this.#name];

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
     * @property {string[]} factions The factions that can provide this augmentation.
     */
    get factions() {
        return [...this.#factions];
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
     * @property {boolean} haveEnoughRep Whether or not we have enough repuration to buy this augmentation from one
     * of the factions that can provide it.
     */
    get haveEnoughRep() {
        const repReq = this.repReq;
        const ns = this.#ns;

        return this.#factions.some(faction => repReq <= ns.getFactionRep(faction));
    }

    /**
     * @property {boolean} canAfford Whether or not we have enough money to buy this augmentation.
     */
    get canAfford() {
        return this.price <= this.#ns.getPlayer().money;
    }

    /**
     * A list of tags that shows what kind of bonuses this Augmentation provides.
     * 
     * Possible values:
     *
     *  - hacking
     *  - combat
     *  - charisma
     *  - hacknet
     *  - faction
     *  - company
     *  - crime
     *  - bladeburner
     *  - utility
     * 
     * @property {string[]} tags
     */
    get tags() {
        return this.#tags || (this.#tags = this.#generateTags()); // Init and cache on first get.
    }

    /**
     * @property {string[]} description A list of stat descriptions for this augmentation.
     */
    get description() {
        return this.#description || (this.#description = this.#generateStatsDescription()); // Init and cache on first get.
    }

    /**
     * Generates a list of tags for this augmentation.
     * @returns {string[]} Augmentation stat descriptions.
     */
    #generateTags() {
        const mults = this.mults;
        const tags = [];

        // Hacking
        if (mults.hacking_mult ||
            mults.hacking_exp_mult ||
            mults.hacking_speed_mult ||
            mults.hacking_chance_mult ||
            mults.hacking_money_mult ||
            mults.hacking_grow_mult
        ) {
            tags.push(AugmentationTags.hacking);
        }

        // Combat
        if (mults.strength_mult ||
            mults.strength_exp_mult ||
            mults.defense_mult ||
            mults.defense_exp_mult ||
            mults.dexterity_mult ||
            mults.dexterity_exp_mult ||
            mults.agility_mult ||
            mults.agility_exp_mult
        ) {
            tags.push(AugmentationTags.combat);
        }
        // Charisma
        if (mults.charisma_mult ||
            mults.charisma_exp_mult
        ) {
            tags.push(AugmentationTags.charisma);
        }

        // Hacknet
        if (mults.hacknet_node_money_mult ||
            mults.hacknet_node_purchase_cost_mult ||
            mults.hacknet_node_level_cost_mult
        ) {
            tags.push(AugmentationTags.hacknet);
        }

        // Faction (rep)
        if (mults.faction_rep_mult) {
            tags.push(AugmentationTags.faction);
        }

        // Company (rep/salary)
        if (mults.company_rep_mult ||
            mults.work_money_mult
        ) {
            tags.push(AugmentationTags.company);
        }

        // Crime
        if (mults.crime_money_mult ||
            mults.crime_success_mult
        ) {
            tags.push(AugmentationTags.crime);
        }

        // Bladeburner
        if (mults.bladeburner_max_stamina_mult ||
            mults.bladeburner_stamina_gain_mult ||
            mults.bladeburner_analysis_mult || 
            mults.bladeburner_success_chance_mult
        ) {
            tags.push(AugmentationTags.bladeburner);
        }

        // Utility ('other' category)
        if (this.startingMoney ||
            (this.programs && this.programs.length) ||
            this.specialEffect
        ) {
            tags.push(AugmentationTags.utility);
        }

        return tags;
    }

    /**
     * Generates a list of stat descriptions for an augmentation.
     * 
     * This method is based on https://github.com/danielyxie/bitburner/blob/dev/src/Augmentation/Augmentation.tsx
     * @returns {string[]} Augmentation stat descriptions.
     */
    #generateStatsDescription() {
        const mults = this.mults;
        const desc = [];

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