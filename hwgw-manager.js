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
    const manager = new HwgwManager({
        ns,
        name: 'HWGW Manager',
        options: ns.flags(argsSchema)
    });

    await manager.start();
}

class HwgwManager extends Manager {
    #counter = 0;

    mainLoop() {
        if (this.#counter === 0) {
            this.log(`Doing fine`);
        } else if (this.#counter === 1) {
            this.warn(`Something fishy going on...`)
        } else if (this.#counter === 2) {
            this.error(`Allrighty, that's it! We're done.`);
        }

        return this.#counter++ < 2;
    }
}