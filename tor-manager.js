import {
    createLogger,
    disableLogs
} from '/util-helpers.js';

const silencedServices = [
	'disableLog',
    'purchaseTor',
	'scan',
    'sleep',
];

const argsSchema = [
	['terminal', false], // `true` to log to terminal too.
    ['run-once', false], // `true` to only run once instead of continuously.
    ['once', false], // alias for 'run-once'
];

/** @param {NS} ns **/
export async function main(ns) {
    disableLogs(ns, silencedServices);

    const pollingInterval = 5000;
    const flagOpts = ns.flags(argsSchema);
    const logToTerminal = flagOpts.terminal;
    const runOnce = flagOpts.once || flagOpts['run-once'];

    const log = createLogger(ns, {logToTerminal});
    const hasTor = () => ns.scan('home').includes('darkweb');

    if (hasTor()) {
        log.info('Already have TOR. NOICE!');

        return; // Already done; bail out.
    }
    
    let ranOnce = false;

    while (!hasTor() && (!runOnce || !ranOnce)) {
        if (ns.purchaseTor()) {
            log.info('Purchased TOR');
        } // false means can't purchase; prolly 'cause no money :'(
        await ns.sleep(pollingInterval);
    }
}