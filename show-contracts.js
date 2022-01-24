import {scanServers} from './util-servers.js';

/** @param {NS} ns **/
export async function main(ns) {
	let servers = scanServers(ns, 0, 0);
	let contracts = [];

	for (let i = 0; i < servers.length; i++) {
		let hostname = servers[i].hostname;
		let filenames = ns.ls(hostname, '.cct');

		filenames.forEach(filename => contracts.push({hostname, filename}));
	}

	if (contracts.length) {
		ns.tprint(`${contracts.length} contracts found:`);
		contracts.forEach((contract, number) => {
			ns.tprint(`(${String.prototype.padStart.call(number, 2)}) ${contract.hostname} - ${contract.filename}`);
		});
	} else {
		ns.tprint(`No contracts found. Did you complete them all, you go-getter? ;)`);
	}
}