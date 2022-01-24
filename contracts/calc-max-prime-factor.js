/** @param {NS} ns **/
export async function main(ns) {
	// Shortcut for usage logging.
	if (ns.args.length === 0 || ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} [number]`);
		return;
	}
	let originalN = ns.args[0];
	let n = originalN;
	let maxPrime = -1;

	while (n % 2 === 0) {
		n = n / 2;
		maxPrime = 2;
	}

	while (n % 3 === 0) {
		n = n / 3;
		maxPrime = 3;
	}

	for (let i = 5;	i <= Math.sqrt(n); i += 6) {
		while (n % i === 0) {
			n = n / i;
			maxPrime = i;
		}

		while (n % (i + 2) === 0) {
			n = n / (i + 2);
			maxPrime = i + 2;
		}
	}
	let result = n > 4 ? n : maxPrime;

	ns.tprint(`Max prime factor of ${originalN} is ${result}`);
}