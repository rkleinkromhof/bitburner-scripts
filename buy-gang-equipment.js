import GangEquipment from '/classes/GangEquipment.js';
import {
    formatMoney
} from '/util-formatters.js';

const argsSchema = [
	['list-price-only', false], // Set to true to only list the prices and not buy anything.
];

/** @param {NS} ns **/
export async function main(ns) {
    const types = [...ns.args];
    const flags = ns.flags(argsSchema);

    const equipmentNames = ns.gang.getEquipmentNames();
    const equipmentObjects = equipmentNames.map(name => new GangEquipment({ ns, name }));
    const combatEquipment = equipmentObjects.filter(equipment => equipment.isCombatEquipment());

    equipmentObjects.sort((equipmentA, equipmentB) => equipmentB.cost - equipmentA.cost);

    let spent = 0;
    let piecesBought = 0;

    for (const equipment of combatEquipment) {
        if (types.length && types.some(type => type.toLowerCase() === equipment.type.toLowerCase())) {
            // ns.tprint(`${equipment.name} (${equipment.type}) @ ${formatMoney(equipment.cost)}: ${Object.entries(equipment.stats).map(([key, value]) => `${key}: ${value}`).join(', ')}`);

            for (const memberName of ns.gang.getMemberNames()) {
                const memberInfo = ns.gang.getMemberInformation(memberName);
                const memberEquipment = [...memberInfo.upgrades, ...memberInfo.augmentations];

                if (!memberEquipment.includes(equipment.name)) {
                    if (!flags['list-price-only']) {
                        ns.gang.purchaseEquipment(memberName, equipment.name);
                    }
                    
                    spent += equipment.cost;
                    piecesBought++;
                } 
            }
        }
    }

    if (flags['list-price-only']) {
        ns.tprint(`${piecesBought} pieces of equipment would cost ${formatMoney(spent)} to purchase.`);
    } else {
        ns.tprint(`Spent ${formatMoney(spent)} on ${piecesBought} pieces of equipment`);
    }
}