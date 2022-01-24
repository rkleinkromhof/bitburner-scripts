import {formatMagnitude} from './util-formatters.js';

/**
 * @param {NS} ns Namespace
 **/
export async function main(ns) {
	// Shortcut for usage logging.
	if (ns.args.length < 1 || ns.args[0] === 'help') {
		ns.tprint(`Usage: ${ns.getScriptName()} [target] ([threads]) ([interval])`);
		return;
	}

	let [target, threads = 1, durationInterval = 1000] = ns.args;

	if (!ns.serverExists(target)) {
		ns.tprint(`Server ${target} not found.`);

		return;
	}
	
	let player = ns.getPlayer();
	let weakenSecurityLowerRate = 0.05;
	let growSecurityIncreaseRate = 0.004;
	let hackSecurityIncreaseRate = 0.002;
	
	let server = ns.getServer(target);
	let serverMaxMoney = server.moneyMax;
	let serverGrowth = server.serverGrowth;

	let toSecs = (millis) => {
		let precision = millis < 1000 ? 3 : (Math.round(millis / 1000) + '').length;
		return (millis / 1000).toPrecision(precision);
	}
	let formatDuration = (millis) => {
		let durHour = 60 * 60 * 1000;
		let durMinute = 60 * 1000;
		let durSecond = 1000;
		let hours = Math.floor(millis / durHour);
		let minutes = Math.floor((millis % durHour) / durMinute);
		let seconds = Math.floor((millis % durMinute) / durSecond);
		let millisLeft = Math.floor(millis % durSecond);
		let result = [];
		
		if (hours) {
			result.push(hours + 'h');
		}
		if (minutes) {
			result.push(minutes + 'm');
		}
		
		result.push(`${seconds}.${millisLeft}s`);

		return result.join('');
	}
	
	let padStart = (str, len, fill = ' ') => {
		return String.prototype.padStart.call(str, len, fill);
	}

	// Security
	let serverMinSecLevel = ns.getServerMinSecurityLevel(target);
	let serverBaseSecLevel = ns.getServerBaseSecurityLevel(target);
	let serverCurrentSecLevel = ns.getServerSecurityLevel(target);

	ns.tprint('======================= HWGW BATCH ANALYSIS ======================');
	ns.tprint(`Hack skill: ${player.hacking}`);
	ns.tprint(`[Security level] base: ${server.baseDifficulty}, min: ${server.minDifficulty}, current: ${server.hackDifficulty.toPrecision(5)}`);
	ns.tprint(`[Money available/max] \$${formatMagnitude(server.moneyAvailable, 'm')}/\$${formatMagnitude(server.moneyMax, 'm')}`);

	let paddedThreads = padStart(threads, 3);
	let valGrowPercent = ns.formulas.hacking.growPercent(server, threads, player);
	let valHackChance = ns.formulas.hacking.hackChance(server, player);
	let valHackExp = ns.formulas.hacking.hackExp(server, player);
	let valHackPercent = ns.formulas.hacking.hackPercent(server, player);

	// Durations
	let durationWeaken = ns.formulas.hacking.weakenTime(server, player);
	let durationGrow = ns.formulas.hacking.growTime(server, player);
	let durationHack = ns.formulas.hacking.hackTime(server, player);
	// let durationInterval = 1000; // TODO make configurable.
	
	let timeNow = 0; //Date.now();
	
	// End times (heh)
	// let timeEndPhase1 = timeNow + durationWeaken - durationInterval;
	// let timeEndPhase2 = timeNow + durationWeaken;
	// let timeEndPhase3 = timeNow + durationWeaken + durationInterval;
	// let timeEndPhase4 = timeNow + durationWeaken + 2 * durationInterval;
	
	// Start times
	let timeStartWeaken1 = timeNow;
	let timeStartWeaken2 = timeStartWeaken1 + 2 * durationInterval;
	let timeStartGrow = timeStartWeaken1 + durationWeaken + durationInterval - durationGrow;
	let timeStartHack = timeStartWeaken1 + durationWeaken - durationInterval - durationHack;
	let timeStartAdjust = Math.abs(Math.min(timeStartWeaken1, timeStartWeaken2, timeStartGrow, timeStartHack, 0));

	// timeStartWeaken1 += timeStartAdjust;
	// timeStartWeaken2 += timeStartAdjust;
	// timeStartGrow += timeStartAdjust;
	// timeStartHack += timeStartAdjust;

	let totalRuntime = durationWeaken + 2 * durationInterval;

	ns.tprint(`Weaken (t=${paddedThreads}) - takes ${formatDuration(durationWeaken)} - lowers security by ${threads * weakenSecurityLowerRate}`);
	ns.tprint(`Grow   (t=${paddedThreads}) - takes ${formatDuration(durationGrow)} - grows by ~${valGrowPercent.toPrecision(3)}% (=\$${formatMagnitude(valGrowPercent * serverGrowth * threads, 'm')} of ${serverMaxMoney} max) - raises security by ${growSecurityIncreaseRate * threads}`);
	ns.tprint(`Hack   (t=${paddedThreads}) - takes ${formatDuration(durationHack)} - ${(valHackChance * 100).toPrecision(3)}% chance to hack for \$${formatMagnitude(valHackPercent * serverMaxMoney * threads, 'm')} - raises security by ${hackSecurityIncreaseRate * threads} - yields ${Math.floor(valHackExp * threads)} xp`);
	
	ns.tprint(`Start time    : ${timeNow}s`);
	ns.tprint(`Dur. interval : ${formatDuration(durationInterval)}`);
	ns.tprint(`Start time adj: ${formatDuration(timeStartAdjust)}`);

	ns.tprint(`Start Weaken 1: ${toSecs(timeStartWeaken1)}s`);
	ns.tprint(`Start Weaken 2: ${toSecs(timeStartWeaken2)}s`);
	ns.tprint(`Start Grow    : ${toSecs(timeStartGrow)}s`);
	ns.tprint(`Start Hack    : ${toSecs(timeStartHack)}s`);

	let processes = [
		{name: 'Weaken 1', endTime: timeStartWeaken1 + durationWeaken},
		{name: 'Weaken 2', endTime: timeStartWeaken2 + durationWeaken},
		{name: 'Grow', endTime: timeStartGrow + durationGrow},
		{name: 'Hack', endTime: timeStartHack + durationHack}
	];
	processes.sort((process1, process2) => process1.endTime - process2.endTime);

	processes.forEach(process => {
		ns.tprint(`End ${process.name.padEnd(10)}: ${toSecs(process.endTime)}`);
	});

	ns.tprint(`1 HWGW batch runs for a total of ${toSecs(totalRuntime)}s`);
	
	ns.tprint('---------------------------------------------------------------')

	let repeat = (str, times) => {
		return String.prototype.repeat.call(str, Math.max(times, 0));
	};
	let totalLength = toSecs(durationWeaken + 2 * durationInterval);
	// ns.tprint(`total length ${totalLength}`);
	let factor = Math.min(Math.round(1000000 / ([durationWeaken, durationGrow, durationHack].reduce((total, duration) => total + duration) / 3)) / 10, 10);

	let durationWeakenSecs = toSecs(durationWeaken);
	let durationGrowSecs = toSecs(durationGrow);
	let durationHackSecs = toSecs(durationHack);
	let durations = [durationWeaken, durationGrow, durationHack];

	ns.tprint(`Weaken: ${durationWeakenSecs}s`);
	ns.tprint(`Grow  : ${durationGrowSecs}s`);
	ns.tprint(`Hack  : ${durationHackSecs}s`);
	ns.tprint(`Min: ${toSecs(Math.min(...durations))}, Max: ${toSecs(Math.max(...durations))}, Avg: ${toSecs(durations.reduce((total, duration) => total + duration) / 3)}`);
	ns.tprint(`Factor: ${factor}`);

	let visTotalLength = Math.ceil(factor * totalLength);
	// let visWhitespaceBeforeFirstPhase = toSecs(Math.ceil(factor * (timeNow + durationWeaken - durationInterval - 1)));
	let visWhitespaceBeforeWeaken1 = toSecs(Math.ceil(factor * timeStartWeaken1));
	let visWhitespaceBeforeWeaken2 = toSecs(Math.ceil(factor * timeStartWeaken2));
	let visWhitespaceBeforeGrow = toSecs(Math.ceil(factor * timeStartGrow));
	let visWhitespaceBeforeHack = toSecs(Math.ceil(factor * timeStartHack));
	// let visWhitespaceBetweenPhases = toSecs(Math.ceil(factor * (durationInterval - 1))) - 1;
	let visLineWeakenLength = toSecs(Math.ceil(factor * durationWeaken));
	let visLineGrowLength = toSecs(Math.ceil(factor * durationGrow));
	let visLineHackLength = toSecs(Math.ceil(factor * durationHack));

	let visLineWeaken1 = `${repeat(' ', visWhitespaceBeforeWeaken1)}${repeat('-', visLineWeakenLength)}`;
	let visLineWeaken2 = `${repeat(' ', visWhitespaceBeforeWeaken2)}${repeat('-',visLineWeakenLength)}`;
	let visLineGrow = `${repeat(' ', visWhitespaceBeforeGrow)}${repeat('-', visLineGrowLength)}`;
	let visLineHack = `${repeat(' ', visWhitespaceBeforeHack)}${repeat('-', visLineHackLength)}`;

	// Visualize!
	ns.tprint(`Total length: ${visTotalLength}`);
	ns.tprint(`   ╔═${repeat('═', visTotalLength)}═╗`);
	ns.tprint(`   ║ ${repeat(' ', visTotalLength)} ║`);
	// ns.tprint(`   ║ ${repeat(' ', visLineHack.length - 1)}|${repeat(' ', visWhitespaceBetweenPhases)}|${repeat(' ', visWhitespaceBetweenPhases)}|${repeat(' ', visWhitespaceBetweenPhases)}| ║`);
	ns.tprint(` W ║ ${visLineWeaken1.padEnd(visTotalLength)} ║ (${formatDuration(durationWeaken)})`);
	ns.tprint(` W ║ ${visLineWeaken2.padEnd(visTotalLength)} ║ (${formatDuration(durationWeaken)})`);
	ns.tprint(` G ║ ${visLineGrow.padEnd(visTotalLength)} ║ (${formatDuration(durationGrow)}s)`);
	ns.tprint(` H ║ ${visLineHack.padEnd(visTotalLength)} ║ (${formatDuration(durationHack)}s)`);
	// ns.tprint(`   ║ ${repeat(' ', visLineHack.length - 1)}|${repeat(' ', visWhitespaceBetweenPhases)}|${repeat(' ', visWhitespaceBetweenPhases)}|${repeat(' ', visWhitespaceBetweenPhases)}| ║`);
	ns.tprint(`   ║ ${repeat(' ', visTotalLength)} ║`);
	ns.tprint(`   ╚═${repeat('═', visTotalLength)}═╝`);
	// ╣║╗╝╚╔╩╦╠═╬
	
}