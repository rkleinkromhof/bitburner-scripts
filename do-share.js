/** @param {NS} ns **/
export async function main(ns) {
	let i = 0;
	
	while (true) {
		await ns.share(); // Keep on sharing!
		i++;
		ns.print(`Shared for ${i} iterations`);
	}
}