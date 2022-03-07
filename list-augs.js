import {
    Arrays,
    sortCaseInsensitiveAlphabetical
} from '/util-helpers.js';

const factions = [
        // Early game
        'CyberSec',
        'Tian Di Hui',
        'Netburners',

        // City factions
        'Sector-12',
        'Aevum',
        'Volhaven',
        'Chongqing',
        'New Tokyo',
        'Ishima',

        // Hacking Groups
        'NiteSec',
        'The Black Hand',
        'BitRunners',

        // Megacorporations
        'ECorp',
        'MegaCorp',
        'KuaiGong International',
        'Four Sigma',
        'NWO',
        'Blade Industries',
        'OmniTek Incorporated',
        'Bachman & Associates',
        'Clarke Incorporated',
        'Fulcrum Secret Technologies',

        // Criminal Organizations
        'Slum Snakes',
        'Tetrads',
        'Silhouette',
        'Speakers for the Dead',
        'The Dark Army',
        'The Syndicate',

        // End-game factions
        'The Covenant',
        'Daedalus',
        'Illuminati',
    ];

/** @param {NS} ns **/
export async function main(ns) {
    const augs = {};
    
    for (const faction of factions) {
        const factionAugs = ns.getAugmentationsFromFaction(faction);

        for (const factionAug of factionAugs) {
            if (!Object.prototype.hasOwnProperty.call(augs, factionAug)) {
                augs[factionAug] = [faction];
            } else {
                augs[factionAug].push(faction);
                augs[factionAug].sort();
            }
        }
    }

    const augKeys = Object.keys(augs);
    augKeys.sort(sortCaseInsensitiveAlphabetical);

    for (let i = 0; i < augKeys.length; i++) {
        const aug = augKeys[i];
        ns.tprint(`(${String.prototype.padStart.call(i, 3)}) ${aug}: ${augs[aug].join(', ')}`);
    }
}