import { disableLogs } from '/util-helpers.js';

const hackFiles = [
	'do-hack.js',
	'do-grow.js',
	'do-weaken.js',
	'do-hwgw.js',
	'util-formatters.js',
	'util-servers.js',
	'util-helpers.js',
];

const silencedLogs = [
	'exec',
	'scp'
];

export function autocomplete(data, args) {
	return [...data.servers];
}

/**
 * @param {NS} ns
 **/
export async function main(ns) {
	if (ns.args.length < 2 || ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} [host] [target]`);
		return;
	}

	disableLogs(ns, silencedLogs);
	
	const [host, target] = ns.args;
	
	// Host is our hacking host, so it's the target for copying files to.
	await ns.scp(hackFiles, host);
	
	ns.exec('do-hwgw.js', host, 1, target, '--continuous');
}