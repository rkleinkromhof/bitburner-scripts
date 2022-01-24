/**
 * Find total number of ways to represent N as the sum of
 * at least two positive integers.
 * @param {NS} ns Namespace
 **/
export async function main(ns) {
	// Shortcut for usage logging.
	if (ns.args.length === 0 || ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} [number]`);
		return;
	}

	//Find total number of ways to represent N as the sum of
 	// integers over the range [1, K]
	let number = ns.args[0];
	let n = number;
	let k = number - 1;

	let dp = Array.from({ length: n + 1}, (_, i) => 0);
	dp[0] = 1;

	// Iterate over the range [1, k + 1]
	for (let row = 1; row < k + 1; row++) {
		// Iterate over the range [1, n + 1]
		for (let col = 1; col < n + 1; col++) {
			if (col >= row) {
				dp[col] = dp[col] + dp[col - row];
			}
		}
	}

	ns.tprint(`Total number of ways to represent ${number}: ${dp[n]}`);;
}