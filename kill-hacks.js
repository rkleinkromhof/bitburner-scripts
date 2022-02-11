/** @param {NS} ns **/
export async function main(ns) {
	const script = 'hack-server.js';

	const processes = ns.ps(ns.getHostname())
		.filter(process => process.filename === script);

	for (const process of processes) {
		ns.kill(process.pid);
	}
}