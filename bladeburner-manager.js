import Manager from '/classes/Manager.js';

import {
	seconds,
} from '/util-helpers.js';

const argsSchema = [
	['ltt', false],
	['log-to-terminal', false],
	['interval', seconds(1)],
];

/** @param {NS} ns **/
export async function main(ns) {
    const manager = new BladeburnerManager({
        ns,
        name: 'Bladeburner Manager',
        options: ns.flags(argsSchema)
    });

    await manager.start();
}

class BladeburnerManager extends Manager {

    /**
     * @param {NS} ns
     */
    mainLoop(ns) {
        const teamMembers = ns.bladeburner.getTeamSize()
    }
}