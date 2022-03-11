import Augmentations from '/classes/Augmentations.js';
import {
    formatMoney
} from '/util-formatters.js';

/** @param {NS} ns **/
export async function main(ns) {
    const tags = [...ns.args];
    let notOwned = false;
    let haveRep = false;
    let haveMoney = false;

    if (tags.includes('notowned')) {
        tags.splice(tags.indexOf('notowned'), 1);
        notOwned = true;
    }
    if (tags.includes('haverep')) {
        tags.splice(tags.indexOf('haverep'), 1);
        haveRep = true;
    }
    if (tags.includes('havemoney')) {
        tags.splice(tags.indexOf('havemoney'), 1);
        haveMoney = true;
    }

    const augs = Augmentations.createAugmentations(ns);
    let i = 0;

    augs.sort((augA, augB) => augB.price - augA.price);

    for (const aug of augs) {
        // ns.tprint(`(${String.prototype.padStart.call(++i, 3)}) ${aug.name}: ${aug.factions.join(', ')}`);
        if (
            (!tags.length || tags.some(tag => aug.tags.includes(tag))) &&
            (!notOwned || !aug.isOwned) &&
            (!haveRep || aug.haveEnoughRep) &&
            (!haveMoney || aug.canAfford)
        ) {
            ns.tprint(`(${String.prototype.padStart.call(++i, 3)}) ${aug.name}: ${aug.tags.join(', ')} (${formatMoney(aug.price)} @ ${aug.factions.join(', ')})`);
        }
    }
}