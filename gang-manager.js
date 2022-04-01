import {
	formatDuration,
	formatNumber,
	formatPercent,
	formatTime,
} from '/util-formatters.js';
import {
	Arrays,
	seconds,
	minutes,
	createLogger,
	disableLogs,
} from '/util-helpers.js';

const createGangThreshold = -54000;

const taskUnassigned = 'Unassigned';
const trainCombatTask = 'Train Combat';
const trainHackingTask = 'Train Hacking';
const trainCharismaTask = 'Train Charisma';
const trainingTasks = [
	trainCombatTask,
	trainHackingTask,
	trainCharismaTask
];
const vigilanteTask = 'Vigilante Justice';
const territoryWarfareTask = 'Territory Warfare';

const taskThresholds = [
	{ name: trainCombatTask, difficulty: 0, hack: 0, str: 0, def: 0, dex: 0, agi: 0, cha: 0},
	// { name: 'Human Trafficking', difficulty: 1.0, hack: 0, str: 40, def: 40, dex: 40, agi: 20, cha: 0 }, // hackety-hack
	{ name: 'Mug People', difficulty: 1.0, hack: 0, str: 200, def: 200, dex: 200, agi: 200, cha: 0 }, // hack: 0, str: 25, def: 25, dex: 25, agi: 10, cha: 15
	// { name: 'Deal Drugs', difficulty: 3.5, hack: 0, str: 0, def: 0, dex: 20, agi: 20, cha: 60 }, // hack: 0, str: 0, def: 0, dex: 20, agi: 20, cha: 60
	// { name: 'Strongarm Civilians', difficulty: 5.0, hack: 10, str: 25, def: 25, dex: 20, agi: 10, cha: 10 }, // hack: 10, str: 25, def: 25, dex: 20, agi: 10, cha: 10
	// { name: 'Run a Con', difficulty: 14.0, hack: 0, str: 5, def: 5, dex: 25, agi: 25, cha: 40 }, // hack: 0, str: 5, def: 5, dex: 25, agi: 25, cha: 40
	// { name: 'Armed Robbery', difficulty: 20.0, hack: 20, str: 15, def: 15, dex: 20, agi: 10, cha: 20 }, // hack: 20, str: 15, def: 15, dex: 20, agi: 10, cha: 20
	// { name: 'Traffick Illegal Arms', difficulty: 32.0, hack: 0, str: 500, def: 500, dex: 500, agi: 0, cha: 0 }, // hack: 15, str: 20, def: 20, dex: 20, agi: 0, cha: 25
	// { name: 'Threaten & Blackmail', difficulty: 28.0, hack: 25, str: 25, def: 0, dex: 25, agi: 0, cha: 25 }, // hack: 25, str: 25, def: 0, dex: 25, agi: 0, cha: 25
	{ name: 'Human Trafficking', difficulty: 36.0, hack: 0, str: 800, def: 800, dex: 800, agi: 0, cha: 0 }, // hack: 30, str: 5, def: 5, dex: 30, agi: 0, cha: 30
	// { name: 'Terrorism', difficulty: 36.0, hack: 0, str: 1200, def: 1200, dex: 1200, agi: 0, cha: 0} // hack: 20, str: 20, def: 20, dex: 20, agi: 0, cha: 20
	
	
	// { name: trainCombatTask, difficulty: 0, hack: 0, str: 0, def: 0, dex: 0, agi: 0, cha: 0},
	// { name: vigilanteTask, difficulty: 1.0, hack: 0, str: 400, def: 400, dex: 400, agi: 400, cha: 0 }, // hack: 0, str: 25, def: 25, dex: 25, agi: 10, cha: 15
	// { name: 'Terrorism', difficulty: 36.0, hack: 0, str: 800, def: 800, dex: 800, agi: 0, cha: 0} // hack: 20, str: 20, def: 20, dex: 20, agi: 0, cha: 20
];

const combatStats = ['str', 'def', 'dex', 'agi'];

const silencedServices = [
    'disableLog',
	'gang.ascendMember',
	'gang.recruitMember',
	'gang.setMemberTask',
	'sleep',
];

const argsSchema = [
	['once', false], // Set to true to run only once instead of continuously.
	['error-tolerance', 3], // Tolerate this many errors. The next one ends the loop.
	['interval', seconds(10)], // Interval between cycles.
	['max-wanted-penalty', 1], // The maximum percentage of wanted level penalty. When this is exceeded, Members are reassigned to reduce wanted level.
	['terminal', false,], // `true` to log to terminal too.
	['training-only', false], // `true` to only do training tasks. This will still do Territory Warfare.
	['vigilante-only', false], // `true` to only do Vigilante Justice. This will still do Territory Warfare.
];

/**
 * @type {NS} ns Namespace
 */
let ns;

/**
 * @type {Ojbect} log Logger
 */
let log;

const avgOfLoops = 3; // Average out the loop duration over this many loops.
const pollingInterval = 200; // ms
const territoryWarfareDuration = 1000; // ms
const territoryWarfareWinChanceThreshold = 0.8; // Engage in Territory Warface with other gangs when win chance is at or over this level. 

let options;
let errorTolerance, interval, maxWantedPenalty, trainingOnly, vigilanteOnly;

let vigilanteMode = false;
const vigilantes = [];
const criminals = [];

/** @param {NS} ns **/
export async function main(_ns) {
    ns = _ns;

	if (!ns.gang.inGang() && ns.heart.break() > createGangThreshold) {
		ns.tprint(`Not in a gang and couldn't join one because our Karma is still too high (${ns.heart.break()}/${createGangThreshold}). Go murder some rando's.`);
        return;
	}

    if (!ns.gang.inGang() && !ns.gang.createGang('Slum Snakes')) {
        ns.tprint(`Not in a gang and couldn't join one. Figure it out.`);
        return;
    }

    disableLogs(ns, silencedServices);
	options = ns.flags(argsSchema);
	interval = options.interval;
	errorTolerance = options.errorTolerance;
	maxWantedPenalty = options['max-wanted-penalty'];
	trainingOnly = options['training-only'];
	vigilanteOnly = options['vigilante-only'];

	log = createLogger(ns, {
		logToTerminal: options.terminal,
		prefix: () => `[${formatTime()}] `
	});

    // const loopDuration = await determineLoopDuration();
    // log(`Recorded loop duration as average over ${avgOfLoops}: ${formatDuration(loopDuration)} (${loopDuration})`);
    const loopDuration = 20000;

	await doCriminalActivities();
    await sleepTillLoopStart();
    await startMainLoop(loopDuration);
	
}

async function startMainLoop(duration) {
    let once = options.once;
    let polling = true;

    do {
        try {
			const gangInfo = ns.gang.getGangInformation();
			const territory = gangInfo.territory;
			const otherGangInfo = ns.gang.getOtherGangInformation();
			const otherGangNames = Object.keys(otherGangInfo).filter(gangName => gangName !== gangInfo.faction);

			// If we have a high enough chance to win and not in Territory Warface already, engage in it.
			if (!gangInfo.territoryWarfareEngaged && otherGangNames.every(gangName => ns.gang.getChanceToWinClash(gangName) > territoryWarfareWinChanceThreshold)) {
				log.info(`Engaging Territory Warface mode because chances to win clashes are at or above ${formatPercent(territoryWarfareWinChanceThreshold)}`);
				ns.gang.setTerritoryWarfare(true);
			}

			// If we're at 100% territory, then other gang form no threat. We can just do our normal activities.
			if (territory >= 100) {
				await doCriminalActivities();
				await ns.sleep(pollingInterval);
			} else {
				let loopStartTime = Date.now();

				while ((Date.now() - loopStartTime) < (duration - territoryWarfareDuration)) {
					await doCriminalActivities();
					await ns.sleep(pollingInterval);
				}

				strengthenTerritory();

				await sleepTillLoopStart();
			}
        } catch (ex) {
            if (ex instanceof TypeError) {
                throw ex; // These are bugs we should fix immediately, so rethrow to get notified.
            }

            log.error(ex.message);
            polling = false;
        }
    }
    while (!once && polling);
}

function strengthenTerritory() {
   assignGangMembers(territoryWarfareTask, false);
}

async function doCriminalActivities() {
    // assignGangMembers('Mug People');

    identifyCriminalsAndVigilantes();
    vigilanteMode = needToReduceWantedLevel();
    await recruitMembers();
    await ascendMembers();
    await reassignTasks();
}

function identifyCriminalsAndVigilantes() {
	let members = getGangMembers();

	for (const member of members) {
		if (member.task === vigilanteTask) {
			Arrays.erase(criminals, member);
			Arrays.include(vigilantes, member);
		} else {
			Arrays.erase(vigilantes, member);
			Arrays.include(criminals, member);
		}
	}
}

function needToReduceWantedLevel() {
	// Gang Wanted Level Penalty: myGang.wantedLevel (=== ns.formulas.gang.wantePenaly(myGang))
	// Gang Wanted Level Gain Rate: myGang.wantedLevelGainRate (=== sum of ns.formulas.gang.wantedLevelGain(...) for all members)
	// Gang Wanted Level: myGang.wantedLevel

	let myGang = ns.gang.getGangInformation();
	let members = getGangMembers();
	let wantedLevelPenalty = ns.formulas.gang.wantedPenalty(myGang);
	let wantedLevelPenaltyPercent = 100 - (100 * wantedLevelPenalty);

	if (myGang.wantedLevelGainRate < 0) {
		// log(`Gang wantedLevel            : ${myGang.wantedLevel}`);
		// log(`Gang wantedPenalty          : ${formatPercent(wantedLevelPenaltyPercent)} (${formatNumber(wantedLevelPenalty, 6, 6)})`);
		// log(`Gang wantedLevelGainRate    : ${myGang.wantedLevelGainRate} (per cycle!)`);
		// log(`Gang wantedLevelGainRate /s?: ${myGang.wantedLevelGainRate * 5}`);
		log(`reaching min wanted level in: ${formatDuration(((myGang.wantedLevel - 1) / Math.abs(myGang.wantedLevelGainRate * 5 * 4)) * 1000)} (-ish?)`);
	}
	// log('-'.repeat(40));

	return wantedLevelPenaltyPercent <= maxWantedPenalty;
}

async function recruitMembers() {
	const nameGenerator = memberNameGenerator(ns.gang.getMemberNames());
	let ok = true;

	while (ok && ns.gang.canRecruitMember()) {
		const name = nameGenerator.next().value;

		ok = ns.gang.recruitMember(name);

		if (ok) {
			log(`Recruited new member: ${name}`);
		} else {
			log(`Something went wrong while recruiting a new member (${name}).`);
		}
		await ns.sleep(100);
	}
}

async function ascendMembers() {
	const members = getGangMembers();

	for (const member of members) {
		if (shouldAscend(member)) {
			ns.gang.ascendMember(member.name);
			log(`Ascending gang member ${member.name}`);
			// ns.gang.setMemberTask(trainCombatTask);
			// combatStats.forEach(stat => {
			// 	const ascStat = stat + '_asc_mult';
			// 	log(`ASCEND => ${member.name}.${stat}: ${member[ascStat]} * ${ns.gang.getAscensionResult(member.name)[stat]} => ${member[ascStat] * ns.gang.getAscensionResult(member.name)[stat]} >= ${getMemberAscMultThreshold(member[ascStat])}`);
			// });
			
		}
		// else if (ns.gang.getAscensionResult(member.name)) {
		// 	combatStats.forEach(stat => {
		// 		const ascStat = stat + '_asc_mult';
		// 		log(`DO NOT ASCEND => ${member.name}.${stat}: ${member[ascStat]} * ${ns.gang.getAscensionResult(member.name)[stat]} => ${member[ascStat] * ns.gang.getAscensionResult(member.name)[stat]} >= ${getMemberAscMultThreshold(member[ascStat])}`);
		// 	});
		// }
	}
}

/**
 * Returns `true` if the given member should ascend.
 * @param {GangMemberInfo} member The gang member.
 */
function shouldAscend(member) {
	const ascensionResult = ns.gang.getAscensionResult(member.name);

	if (ascensionResult) {
		 const nOfPrimedStats = combatStats.filter(stat => {
			const statName = `${stat}_asc_mult`;
			const memberStatAscMult = member[statName];

			return memberStatAscMult && ((memberStatAscMult * ascensionResult[stat]) >= getMemberAscMultThreshold(memberStatAscMult));
		}).length;

		return nOfPrimedStats >= combatStats.length - 1; // One stat may be lagging behind. Ascend if most are primed.
	}
	return false;
}

function getMemberAscMultThreshold(memberStatAscMult) {
	// This might seem overly complex than just (2 * memberStatAscMult)
	// but this formula results in a slightly earlier ascention compared to that.
	return  (2 * memberStatAscMult) - Math.sqrt(0.1 * memberStatAscMult);
}

async function reassignTasks() {
	const members = getGangMembers();
	const roster = members.map(member => { return { member, task: getIdealTask(member)} }); // [member, task]

	// TODO check if we need to assign members to reduce wanted level.

	// if (vigilanteMode) {
	// 	const criminals = members.maps();
	// }

	const reassignments = roster
		.filter(assignment => assignment.member.task !== assignment.task.name);

	if (reassignments.length) {
		for (const reassignment of reassignments) {
			// For now, don't touch Members that are assigned to reduce wanted level.
			if (reassignment.member.task !== vigilanteTask) {
				ns.gang.setMemberTask(reassignment.member.name, reassignment.task.name);

				// If we're switching tasks, log it, unless it was Territory Warfare, because that ticks every ~20 seconds
				// and we don't need to log all that.
				if (reassignment.member.task !== territoryWarfareTask) {
					log(`Assigned ${reassignment.member.name} to ${reassignment.task.name}`);
				}
			}
			await ns.sleep(100);
		}
	}

	// Assign members their new tasks, those who aren't already on that task.	
}

function buildCombatTaskStats() {
	return ns.gang.getTaskNames() // Get all of this gang's tasks
		.filter(task => trainingTasks.indexOf(task) < 0 && task !== territoryWarfareTask) // filter out training and warfare tasks
		.map(task => ns.gang.getTaskStats(task)) // convert to GangTaskStats
		.sort((taskA, taskB) => taskA.difficulty - taskB.difficulty); // sort by difficulty. This should already be the case, but just to be sure.
}

/**
 * Finds the task best suited for the given member's skills.
 * @param {GangMemberInfo} member The gang member's info.
 */
function getIdealTask(member) {
	let filter;

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
	if (trainingOnly) {
		filter = task => task.name === trainCombatTask;
	} else if (vigilanteOnly) {
		return {name: vigilanteTask};
	}
	else {
		filter = task => member.hack >= task.hack && member.str >= task.str && member.def >= task.def && member.dex >= task.dex && member.agi >= task.agi && member.cha >= task.cha;
	}
	
	const suitedTasks = taskThresholds
		.filter(filter)
		.sort((taskA, taskB) => taskB.difficulty - taskA.difficulty);

	
	return Object.assign({}, suitedTasks[0]);
}

async function determineLoopDuration() {
    let loops = 0;
    let lastGangsPower = getGangsTotalPower();
    let loopStartTime = 0;
    let loopEndTime = 0;

    log(`Waiting for gangs power processing tick...`);

    await sleepTillLoopStart();
    loopStartTime = Date.now();
    log(`Loop started at ${loopStartTime}`);
    lastGangsPower = getGangsTotalPower();

    // Record loops time.
    while (loops < avgOfLoops) {
        const currentGangPower = getGangsTotalPower();
        if (lastGangsPower !== currentGangPower) {
            lastGangsPower = currentGangPower;
            loops++;
            log(`Detected loop ${loops} of ${avgOfLoops}`);
        }
        if (loops < avgOfLoops) {
            await ns.sleep(pollingInterval);
        }
    }
    loopEndTime = Date.now();
    log(`Loop ended at ${loopEndTime}`);

    return (loopEndTime - loopStartTime) / loops;
}

async function sleepTillLoopStart() {
    // Wait for loop start.
    const gangPowerAtStart = getGangsTotalPower();

    while (gangPowerAtStart === getGangsTotalPower()) {
        await ns.sleep(pollingInterval);
    }
    return;
}

function getGangsTotalPower() {
    const gangsInfo = ns.gang.getOtherGangInformation();
    let power = 0;

    for (const gangName of Object.keys(gangsInfo)) {
        power += gangsInfo[gangName].power;
    }

    return power;
}

function assignGangMembers(task, logIt = false) {
    const members = getGangMembers();

    for (const member of members) {
        // For now, don't touch Members that are assigned to reduce wanted level.
        if (member.task !== vigilanteTask && member.task !== task) {
            ns.gang.setMemberTask(member.name, task);
			if (logIt) {
            	log(`Assigned ${member.name} to ${task}`);
			}
        }
    }
}

function getGangMembers() {
	return ns.gang.getMemberNames()
		.map(name => ns.gang.getMemberInformation(name));
}

function* memberNameGenerator(exclude = null) {
	let names = [
		'Ajani Goldmane',
		'Angrath',
		'Arlinn Kord',
		'Ashiok',
		'Basri Ket',
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