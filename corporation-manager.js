/** @param {NS} ns **/
export async function main(ns) {
	let corp;

	try {
		corp = ns.corporation.getCorporation();
	}
	catch (ex) {
		// Didn't own a corporation;
		corp = null;
	}

	if (!corp && ns.corporation.createCorporation('WoepCo', false)) { // ns.getPlayer().bitNodeN !== 3
		corp = ns.corporation.getCorporation();
	}

	if (corp) {
		ns.tprint(`${corp.name} offices are open.`);
	}
}