const hackFiles = [
	'do-hack.js',
	'do-grow.js',
	'do-weaken.js',
	'do-hwgw.js',
	'util-formatters.js',
	'util-servers.js',
	'util-helpers.js',
];

/** @param {NS} ns **/
export async function main(ns) {
	const target = ns.args[0];

	await ns.scp(hackFiles, 'home', target);
}