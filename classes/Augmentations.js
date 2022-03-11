import Augmentation from '/classes/Augmentation.js';
import {
    factions,
    sortCaseInsensitiveAlphabetical,
} from '/util-helpers.js';

/**
 * Factory for Augmentation instances.
 */
export default class Augmentations {
    /**
     * Creates a list of Augmentations.
     * @param {NS} ns Namespace
     */
    static createAugmentations(ns) {
        const augsAndFactions = {};
        const result = [];

        for (const faction of factions) {
            const factionAugs = ns.getAugmentationsFromFaction(faction);

            for (const factionAug of factionAugs) {
                if (!Object.prototype.hasOwnProperty.call(augsAndFactions, factionAug)) {
                    augsAndFactions[factionAug] = [faction];
                } else {
                    augsAndFactions[factionAug].push(faction);
                    augsAndFactions[factionAug].sort();
                }
            }
        }

        const augKeys = Object.keys(augsAndFactions);
        augKeys.sort(sortCaseInsensitiveAlphabetical);

        for (let i = 0; i < augKeys.length; i++) {
            const name = augKeys[i];
            // ns.tprint(`(${String.prototype.padStart.call(i, 3)}) ${aug}: ${augsAndFactions[aug].join(', ')}`);
            result.push(new Augmentation({
                ns,
                name,
                factions: augsAndFactions[name]
            }));
        }

        return result;
    }
}