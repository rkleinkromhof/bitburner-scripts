/** @param {NS} ns **/
export async function main(ns) {
	return await ns.weaken(ns.args[0]);
}