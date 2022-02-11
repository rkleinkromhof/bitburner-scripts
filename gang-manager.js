import {
	formatDuration,
	formatNumber,
	formatPercent,
	formatTime,
} from '/util-formatters.js';
import {
	seconds,
	minutes,
	createLogger,
	disableLogs,
} from '/util-helpers.js';


const taskUnassigned = 'Unassigned';
const trainCombatTask = 'Train Combat';
const trainHackingTask = 'Train Hacking';
const trainCharismaTask = 'Train Charisma';
const trainingTasks = [
	trainCombatTask,
	trainHackingTask,
	trainCharismaTask
];
const vigilanteTask = 'Vigilante Justice'
const territoryWarfareTask = 'Territory Warfare';

const taskThresholds = [
	{ name: trainCombatTask, difficulty: 0, hack: 0, str: 0, def: 0, dex: 0, agi: 0, cha: 0},
	{ name: 'Mug People', difficulty: 1.0, hack: 0, str: 20, def: 20, dex: 20, agi: 10, cha: 0 }, // hack: 0, str: 25, def: 25, dex: 25, agi: 10, cha: 15
	// { name: 'Deal Drugs', difficulty: 3.5, hack: 0, str: 0, def: 0, dex: 20, agi: 20, cha: 60 }, // hack: 0, str: 0, def: 0, dex: 20, agi: 20, cha: 60
	// { name: 'Strongarm Civilians', difficulty: 5.0, hack: 10, str: 25, def: 25, dex: 20, agi: 10, cha: 10 }, // hack: 10, str: 25, def: 25, dex: 20, agi: 10, cha: 10
	// { name: 'Run a Con', difficulty: 14.0, hack: 0, str: 5, def: 5, dex: 25, agi: 25, cha: 40 }, // hack: 0, str: 5, def: 5, dex: 25, agi: 25, cha: 40
	// { name: 'Armed Robbery', difficulty: 20.0, hack: 20, str: 15, def: 15, dex: 20, agi: 10, cha: 20 }, // hack: 20, str: 15, def: 15, dex: 20, agi: 10, cha: 20
	// { name: 'Traffick Illegal Arms', difficulty: 32.0, hack: 0, str: 500, def: 500, dex: 500, agi: 0, cha: 0 }, // hack: 15, str: 20, def: 20, dex: 20, agi: 0, cha: 25
	// { name: 'Threaten & Blackmail', difficulty: 28.0, hack: 25, str: 25, def: 0, dex: 25, agi: 0, cha: 25 }, // hack: 25, str: 25, def: 0, dex: 25, agi: 0, cha: 25
	{ name: 'Human Trafficking', difficulty: 36.0, hack: 0, str: 500, def: 500, dex: 700, agi: 0, cha: 0 }, // hack: 30, str: 5, def: 5, dex: 30, agi: 0, cha: 30
	// { name: 'Terrorism', difficulty: 36.0, hack: 0, str: 1200, def: 1200, dex: 1200, agi: 0, cha: 0} // hack: 20, str: 20, def: 20, dex: 20, agi: 0, cha: 20
];

const combatStats = ['str', 'def', 'dex', 'agi'];

/**
 * Global Namespace reference.
 * @type NS
 */
let _ns;

/**
 * Logs the given message
 * @param {String} message
 * @type Function
 */
let _log;

const silencedServices = [
	'disableLog',
	'gang.ascendMember',
	'gang.recruitMember',
	'sleep',
];

const argsSchema = [
	['continuous', false], // Set to true to run continuously, otherwise, it runs once.
	['c', false], // Alais for continuous.
	['error-tolerance', 3], // Tolerate this many errors. The next one ends the loop.
	['interval', seconds(10)], // Interval between cycles.
	['max-wanted-penalty', 2], // The maximum percentage of wanted level penalty. When this is exceeded, Members are reassigned to reduce wanted level.
	['tail', false], // `true` to tail the script.
	['terminal', false,], // `true` to log to terminal too.
];

let options;
let errorTolerance, interval, maxWantedPenalty;

let vigilanteMode = false;
const vigilantes = [];
const criminals = [];

/**
 * CLI autocomplete.
 * @param {Object} data General data about the game you might want to autocomplete.
 * @param {String[]} data.serrvers List of all servers in the game.
 * @param {String[]} data.txts List of text files on the current server.
 * @param {String[]} data.scripts List of all scripts on the current server.
 * @param {String[]} data.flags The same flags function as passed with ns. Calling this function adds all the flags as autocomplete arguments.
 * @param {String[]} args Current arguments. Minus `run script.js`.
 */
// export function autocomplete(data, args) {
// 	let options = data.flags(argsSchema);

// 	return [...Object.keys(options).map(key => key.length === 1 ? `-${key}` : `--${key}`)]; // {"_":["a"],"continuous":false,"c":false,"error-tolerance":3,"interval":10000,"max-wanted-penalty":2,"tail":false,"terminal":false} 
// 	// return [...data.flags(argsSchema)];
// 	// return ['--continuous'];
// }

/**
 * @param {NS} ns
 */
export async function main(ns) {
	disableLogs(ns, silencedServices);
	options = ns.flags(argsSchema);
	interval = options.interval;
	errorTolerance = options.errorTolerance;
	maxWantedPenalty = options['max-wanted-penalty'];
	
	let continuous = options.continuous || options.c;

	_ns = ns;
	_log = createLogger(ns, options.terminal);

	if (options.tail) {
		ns.tail();
	}

	if (ns.gang.inGang()) {
		let polling = true;
		let errors = 0;

		do {
			try {
				identifyCriminalsAndVigilantes();
				vigilanteMode = needToReduceWantedLevel();
				await recruitMembers();
				await ascendMembers();
				await reassignTasks();
			} catch (ex) {
				if (ex instanceof TypeError) {
					throw ex; // These are bugs we should fix immediately, so rethrow to get notified.
				}

				_log(`Error: ${ex}`);
				errors++;
				if (errors > errorTolerance) {
					_log('Too many errors; stopping script.');
					polling = false;
				}
			}

			if (continuous) {
				await ns.sleep(interval);
			}
		}
		while (continuous && polling)

	} else {
		_log('Not in a gang. Please join one.');
	}
}

function identifyCriminalsAndVigilantes() {
	let members = getGangMembers();

	for (const member of members) {
		if (member.task === vigilanteTask && vigilantes.indexOf(member) < 0) {
			
			vigilantes.push(member);
		}
	}
}

function needToReduceWantedLevel() {
	// Gang Wanted Level Penalty: myGang.wantedLevel (=== ns.formulas.gang.wantePenaly(myGang))
	// Gang Wanted Level Gain Rate: myGang.wantedLevelGainRate (=== sum of ns.formulas.gang.wantedLevelGain(...) for all members)
	// Gang Wanted Level: myGang.wantedLevel

	let myGang = _ns.gang.getGangInformation();
	let members = getGangMembers();
	let wantedLevelPenalty = _ns.formulas.gang.wantedPenalty(myGang);
	let wantedLevelPenaltyPercent = 100 - (100 * wantedLevelPenalty);

	_log(`Gang wantedLevel            : ${myGang.wantedLevel}`);
	_log(`Gang wantedPenalty          : ${formatPercent(wantedLevelPenaltyPercent)} (${formatNumber(wantedLevelPenalty, 6, 6)})`);
	_log(`Gang wantedLevelGainRate    : ${myGang.wantedLevelGainRate} (per cycle!)`);
	_log(`Gang wantedLevelGainRate /s?: ${myGang.wantedLevelGainRate * 5}`);
	if (myGang.wantedLevelGainRate < 0) {
		_log(`reaching min wanted level in: ${formatDuration((myGang.wantedLevel - 1) / Math.abs(myGang.wantedLevelGainRate))}`);
	}
	_log('-'.repeat(40));

	return wantedLevelPenaltyPercent <= maxWantedPenalty;
}

async function recruitMembers() {
	const nameGenerator = memberNameGenerator(_ns.gang.getMemberNames());
	let ok = true;

	while (ok && _ns.gang.canRecruitMember()) {
		const name = nameGenerator.next().value;

		ok = _ns.gang.recruitMember(name);

		if (ok) {
			_log(`Recruited new member: ${name}`);
		} else {
			_log(`Something went wrong while recruiting a new member (${name}).`);
		}
		await _ns.sleep(100);
	}
}

async function ascendMembers() {
	const members = getGangMembers();

	for (const member of members) {
		if (shouldAscend(member)) {
			_ns.gang.ascendMember(member.name);
			// _ns.gang.setMemberTask(trainCombatTask);
			// combatStats.forEach(stat => {
			// 	const ascStat = stat + '_asc_mult';
			// 	_log(`ASCEND => ${member.name}.${stat}: ${member[ascStat]} * ${_ns.gang.getAscensionResult(member.name)[stat]} => ${member[ascStat] * _ns.gang.getAscensionResult(member.name)[stat]} >= ${getMemberAscMultThreshold(member[ascStat])}`);
			// });
			
		}
		// else if (_ns.gang.getAscensionResult(member.name)) {
		// 	combatStats.forEach(stat => {
		// 		const ascStat = stat + '_asc_mult';
		// 		_log(`DO NOT ASCEND => ${member.name}.${stat}: ${member[ascStat]} * ${_ns.gang.getAscensionResult(member.name)[stat]} => ${member[ascStat] * _ns.gang.getAscensionResult(member.name)[stat]} >= ${getMemberAscMultThreshold(member[ascStat])}`);
		// 	});
		// }
	}
}

/**
 * Returns `true` if the given member should ascend.
 * @param {GangMemberInfo} member The gang member.
 */
function shouldAscend(member) {
	const ascensionResult = _ns.gang.getAscensionResult(member.name);

	if (ascensionResult) {
		return combatStats.every(stat => {
			const statName = `${stat}_asc_mult`;
			const memberStatAscMult = member[statName];

			return memberStatAscMult && ((memberStatAscMult * ascensionResult[stat]) >= getMemberAscMultThreshold(memberStatAscMult));
		});
	}
	return false;
}

function getMemberAscMultThreshold(memberStatAscMult) {
	return  (2 * memberStatAscMult) - Math.sqrt(0.1 * memberStatAscMult);
}

async function reassignTasks() {
	const members = getGangMembers();
	const roster = members.map(member => { return { member, task: getIdealTask(member)} }); // [member, task]

	// Check if we need to assign members to reduce wanted level.

	// if (vigilanteMode) {
	// 	const criminals = members.maps();
	// }

	const reassignments = roster
		.filter(assignment => assignment.member.task !== assignment.task.name);

	if (reassignments.length) {
		for (const reassignment of reassignments) {
			// For now, don't touch Members that are assigned to reduce wanted level.
			if (reassignment.member.task !== vigilanteTask) {
				_ns.gang.setMemberTask(reassignment.member.name, reassignment.task.name);
				_log(`Assigned ${reassignment.member.name} to ${reassignment.task.name}`);
			}
			await _ns.sleep(100);
		}
	} else {
		_log(`All members are already assigned correctly`);
	}


	// Assign members their new tasks, those who aren't already on that task.
	
}

function buildCombatTaskStats() {
	return _ns.gang.getTaskNames() // Get all of this gang's tasks
		.filter(task => trainingTasks.indexOf(task) < 0 && task !== territoryWarfareTask) // filter out training and warfare tasks
		.map(task => _ns.gang.getTaskStats(task)) // convert to GangTaskStats
		.sort((taskA, taskB) => taskA.difficulty - taskB.difficulty); // sort by difficulty. This should already be the case, but just to be sure.
}

/**
 * Finds the task best suited for the given member's skills.
 * @param {GangMemberInfo} member The gang member's info.
 */
function getIdealTask(member) {
	// Combat gang tasks: (these outputs come from the Gang API)
	//  c?  Task name                diff (hck/str/def/dex/agi/cha)
	// ----------------------------------------------------------------------------------
	// 		Unassigned 				  1.0  100/  0/  0/  0/  0/  0
	// (*)	Mug People 				  1.0    0/ 25/ 25/ 25/ 10/ 15
	// (*)	Deal Drugs 				  3.5    0/  0/  0/ 20/ 20/ 60
	// (*)	Strongarm Civilians 	  5.0   10/ 25/ 25/ 20/ 10/ 10
	// (*)	Run a Con 				 14.0    0/  5/  5/ 25/ 25/ 40
	// (*)	Armed Robbery 			 20.0   20/ 15/ 15/ 20/ 10/ 20
	// (*)	Traffick Illegal Arms 	 32.0   15/ 20/ 20/ 20/  0/ 25
	// (*)	Threaten & Blackmail 	 28.0   25/ 25/  0/ 25/  0/ 25
	// (*)	Human Trafficking 		 36.0   30/  5/  5/ 30/  0/ 30
	// 		Terrorism 				 36.0   20/ 20/ 20/ 20/  0/ 20
	// 		Vigilante Justice 		  1.0   20/ 20/ 20/ 20/ 20/  0
	// 		Train Combat 			100.0    0/ 25/ 25/ 25/ 25/  0
	// 		Train Hacking 			 45.0  100/  0/  0/  0/  0/  0
	// 		Train Charisma 			  8.0    0/  0/  0/  0/  0/100
	// 		Territory Warfare 		  5.0   15/ 20/ 20/ 20/ 20/  5
	// * => these are the tasks we count as combat tasks
	
	let suitedTasks = taskThresholds
		.filter(task => member.hack >= task.hack && member.str >= task.str && member.def >= task.def && member.dex >= task.dex && member.agi >= task.agi && member.cha >= task.cha)
		.sort((taskA, taskB) => taskB.difficulty - taskA.difficulty);
	
	return Object.assign({}, suitedTasks[0]);
}

function getGangMembers() {
	return _ns.gang.getMemberNames()
		.map(name => _ns.gang.getMemberInformation(name));
}

function printMemberInfo() {
	const names = _ns.gang.getMemberNames();

	_log('Meet the gang:');
	for (let i = 0; i < names.length; i++) {
		let member = _ns.gang.getMemberInformation(names[i]);

		_log(`${member.name} ${member.task === taskUnassigned ? 'is unassigned' : `is assigned to ${member.task}`}. They have earned ${formatNumber(member.earnedRespect)} respect.`);
	}
}

function getLogTime() {
	return formatTime();
}

function* memberNameGenerator(exclude = null) {
	let names = [
		'Ajani Goldmane',
		'Angrath',
		'Arlinn Kord',
		'Ashiok',
		'Basri Ket ',
		'Calix',
		'Chandra Nalaar',
		'Daretti',
		'Davriel Cane',
		'Elspeth Tirel',
		'Garruk Wildspeaker',
		'Huatli',
		'Jace Beleren',
		'Jaya Ballard',
		'Jiang Yanggu',
		'Kaito Shizuki',
		'Karn',
		'Kasmina',
		'Kaya',
		'Kiora',
		'Koth',
		'Liliana Vess',
		'Lukka',
		'Mu Yanling',
		'Nahiri',
		'Narset',
		'Nicol Bolas',
		'Niko Aris',
		'Nissa Revane',
		'Ob Nixilis',
		'Oko',
		'Ral Zarek',
		'Rowan Kenrith',
		'Saheeli Rai',
		'Samut',
		'Sarkhan Vol',
		'Sorin Markov',
		'Tamiyo',
		'Teferi',
		'Tezzeret',
		'Teyo Verada',
		'The Wanderer',
		'Tibalt',
		'Tyvar Kell',
		'Ugin',
		'Vivien Reid',
		'Vraska',
		'Will Kenrith',
		'Wrenn',
	];

	if (exclude && Array.isArray(exclude)) {
		names = names.filter(name => exclude.indexOf(name) < 0);
	}

	while (names.length) {
		let name = names.splice(Math.floor(Math.random() * (names.length - 1)), 1);

		yield name;
	}
}

// Popular names from all over the world:
// 'Omar',
// 'Mohamed',
// 'Khaled',
// 'Imene',
// 'Farida',
// 'Aya',
// 'Mateo',
// 'Miguel',
// 'Liam',
// 'Inuk',
// 'Santiago',
// 'Ramón',
// 'José',
// 'Emma',
// 'Alysha',
// 'Victoria',
// 'Ali',
// 'Adam',
// 'Kiran',