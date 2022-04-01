/** @param {NS} ns **/
export async function main(ns) {
    const host = ns.getHostname();
    const sleepTime = 500;

    [
        'disableLog',
        'exec',
        'sleep'
    ].forEach(service => ns.disableLog(service));

    await runIfNotRunning({
        ns,
        script: 'daemon.js',
        host,
        args: ['--no-hacknet-manager'],
        sleepTime
    });

    await runIfNotRunning({
        ns,
        script: 'grind-xp.js',
        host,
        args: ['all'],
        sleepTime
    });


    await runIfNotRunning({
        ns,
        script: 'train.js',
        host,
        sleepTime
    });

    await runIfNotRunning({
        ns,
        script: 'grind-xp.js',
        host,
        args: [host, 'joesguns'],
        sleepTime
    });
}

/**
 * Runs script if not currently running
 * @param {Ojbect} config Config
 * @param {NS} config.ns Namespace
 * @param {string} config.host Hostname
 * @param {Mixed[]} config.args Script arguments
 * @param {number} config.sleepTime Time to sleep after starting the script.
 */
async function runIfNotRunning(config) {
    const {ns, script, host, args, sleepTime} = config;

    if (!ns.isRunning(script, host) && (!args?.length || !ns.isRunning(script, host, args))) {
        ns.print(`Starting ${script} on ${host} ${args ? `with args [${args.join(', ')}]` : 'without args'}`);
        ns.exec(script, host, 1, ...args || []);
        await ns.sleep(sleepTime);
    }
}