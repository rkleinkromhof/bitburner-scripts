import {formatMoney} from "util-formatters.js";

/** @param {NS} ns **/
export async function main(ns) {
	let target = ns.args[0];
	
	if (ns.serverExists(target)) {
 		if (ns.deleteServer(target)) {
			ns.tprint(`Server ${target} deleted.`);
		} else {
			ns.tprint(`Delete server ${target} FAILED.`);
		}
	} else {
		ns.tprint(`Server ${target} does not exist.`);
	}
}