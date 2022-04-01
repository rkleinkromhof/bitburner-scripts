/** @param {NS} ns **/
export async function main(ns) {
    const mults = ns.getBitNodeMultipliers();
    const multLines = Object.keys(mults).map(prop => `${prop}: ${mults[prop]}`);

    ns.tprint(`Mults: ${multLines.join('\n')}`);

    ns.tprint(`Current bitnode: ${ns.getPlayer().bitNodeN}`);
    ns.tprint(`Owned sourcefiles: ${ns.getOwnedSourceFiles().map(sourceFile => `${sourceFile.n}.${sourceFile.lvl}`).join(', ')}`);
}