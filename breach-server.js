/** @param {NS} ns **/
export async function main(ns) {
	let scriptUrl = 'https://raw.githubusercontent.com/rkleinkromhof/bitburner-scripts/main/hack-v3.js';
	let targetFilename = 'hack-v3.js';
	let target = ns.args[0];

	if (!ns.serverExists(target)) {
		ns.tprint(`Server not found: ${target}`);

		return;
	}

	if (ns.fileExists('BruteSSH.exe', 'home')) {
		ns.tprint(`Opening SSH port on ${target}`);
		ns.brutessh(target);
	}
	
	if (ns.fileExists('FTPCrack.exe', 'home')) {
		ns.tprint(`Opening FTP port on ${target}`);
		ns.ftpcrack(target);
	}

	if (ns.fileExists('relaySMTP.exe', 'home')) {
		ns.tprint(`Opening SMTP port on ${target}`);
		ns.relaysmtp(target);
	}

	if (ns.fileExists('HTTPWorm.exe', 'home')) {
		ns.tprint(`Opening HTTP port on ${target}`);
		ns.httpworm(target);
	}

	if (ns.fileExists('SQLInject.exe', 'home')) {
		ns.tprint(`Opening SQL port on ${target}`);
		ns.sqlinject(target);
	}

	if (!ns.hasRootAccess(target)) {
		ns.tprint(`Gaining root access to ${target}`);
		ns.nuke(target);
	}

	if (!ns.fileExists(targetFilename, target)) {
		ns.tprint(`Copying ${targetFilename} to ${target}`);
		return await ns.wget(scriptUrl, targetFilename, target);
	}
	return Promise.resolve(true); // File exists, so resolve (true);
}