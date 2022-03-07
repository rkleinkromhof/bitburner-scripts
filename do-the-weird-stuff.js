/** @param {NS} ns **/
export async function main(ns) {
    ns.tprint(`Karma: ${ns.heart.break()}`);
    ns.tprint(`Kills: ${ns.getPlayer().numPeopleKilled}`);

   

    return eval('document').getElementById('terminal').insertAdjacentHTML('beforeend', Unclickable.unclickable());
}