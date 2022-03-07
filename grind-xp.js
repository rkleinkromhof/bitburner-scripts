import { disableLogs } from '/util-helpers.js';
import { scanServers } from '/util-servers.js';

const grindScript = 'do-grind-xp.js';

const silencedLogs = [
	'exec',
	'scp'
];

const weakenRamPerThread = 1.75;

export function autocomplete(data, args) {
	return [...data.servers];
}

/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length < 1 || ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} [hostname | all] [target]`);
		return;
	}

	disableLogs(ns, silencedLogs);

	let [host, target] = ns.args;

	if (host === 'all') {	
		 // Get all hackable servers with at least 4GB of RAM.
		const servers = scanServers(ns, 4, 0, 'hackable')
			.filter(server => !ns.isRunning(grindScript, server.hostname, server.hostname));

		if (servers.length) {
			for (const server of servers) {
				await grindXp(ns, server.hostname, server.hostname);
			}
		} else {
			ns.tprint(`INFO: no hackable servers found that weren't already running ${grindScript}`);
		}
	} else {
		await grindXp(ns, host, target || host); // Single argument means host === target
	}
}

async function grindXp(ns, host, target) {
	// Host is our hacking host, so it's the target for copying files to.
	await ns.scp(grindScript, host);

	const ramAvailable = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
	const threads = Math.floor(ramAvailable / weakenRamPerThread);

	if (threads > 0) {
		ns.exec(grindScript, host, threads, target);
		ns.tprint(`INFO: started grinding xp on ${host} targeting ${target} with ${threads} threads`);
	} else if (ns.isRunning(grindScript, host, target)) {
		ns.tprint(`WARN: script is already running`);
	} else {
		ns.tprint(`WARN: not enough RAM left on ${host} to run ${grindScript}`);
	}
}