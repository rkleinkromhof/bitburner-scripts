const testHost = 'home';
const testDir = '/unittests';

const argsSchema = [
	['debug', false],
	['log-passed', false]
];

export function autocomplete(data, args) {
	const opts = data.flags(argsSchema);

	return [...Object.keys(opts)];
}

/** @param {NS} ns **/
export async function main(ns) {
	const suites = ns.ls(testHost, `${testDir}/test-`);

	ns.disableLog('disableLog');
	ns.disableLog('exec');
	ns.tprint(`Executing ${suites.length} suites.`);

	for (let suite of suites) {
		ns.exec(suite, testHost, 1, ...Array.prototype.slice.call(ns.args));
	}
}