import NamespaceHolder from '/classes/NamespaceHolder.js';

/**
 * Equipment for Gang Members.
 */
export default class GangEquipment extends NamespaceHolder {
    static #combatStats = ['str', 'def', 'dex', 'agi', 'cha']; // Counting Charisma as combat stat.
    static #hackStats = ['hack'];

    /**
     * Equipment name.
     * @type {string}
     */
    #name;

    /**
     * Equipment type.
     * @type {string}
     */
    #type;

    /**
     * Equipment stats.
     * @type {EquipmentStats}
     */
    #stats;

    /**
     * Creates a GangEquipment.
     * @param {Object} config Configuration.
     * @param {Namespace} config.ns Namespace.
     * @param {string} config.name Equipment name.
     */
    constructor(config) {
        const {ns, name} = config;

        super(ns);
        this.#name = name;
    }

     /**
     * Equipment name.
     * @type {string}
     */
    get name() {
        return this.#name;
    }

    /**
     * Equipment type.
     * @type {string}
     */
    get type() {
        return this.#type || (this.#type = this.ns.gang.getEquipmentType(this.#name));
    }

    /**
     * Equipment stats.
     * @type {EquipmentStats}
     */
    get stats() {
        return this.#stats || (this.#stats = this.ns.gang.getEquipmentStats(this.#name));
    }

    /**
     * Equipment cost.
     * 
     * This can vary based on the player's discount.
     * @type {number}
     */
    get cost() {
        return this.ns.gang.getEquipmentCost(this.name); // We cannot cache this because it can vary, based on the player's discount.
    }

    /**
     * Returns the value for a specific stat.
     * @returns {number} The stat value.
     */
    getStat(stat) {
        return this.stats[stat] || null;
    }

    /**
     * Returns `true` if this piece of equipment provides a bonus to combat stats; otherwise `false`.
     * @return {boolean}
     */
    isCombatEquipment() {
        return Object.keys(this.stats).some(stat => GangEquipment.#combatStats.includes(stat));
    }

    /**
     * Returns `true` if this piece of equipment provides a bonus to combat stats; otherwise `false`.
     * @return {boolean}
     */
    isHackEquipment() {
        return Object.keys(this.stats).some(stat => GangEquipment.#hackStats.includes(stat));
    }
}