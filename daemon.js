import {
	Arrays,
	seconds,
	minutes,
	hours,
	createLogger,
	disableLogs
} from '/util-helpers.js';
import {
	formatDuration,
	formatTime
} from '/util-formatters.js';

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

let _host; // The host to run on. Should only be 'host'.

const silencedServices = [
	'disableLog',
	'exec',
	'getHackingLevel',
	'getServerMaxRam',
	'getServerUsedRam',
	'scan',
	'sleep',
];

let scheduledServices = [
	{
		name: 'Stats Tracker',
		script: 'track-stats.js',
		args: [],
		// Run immediately and only once. This runs continuously on its own.
		runOnce: true
	},
	{
		name: 'Host Manager',
		script: 'host-manager.js',
		args: ['-c'],
		// Run immediately and only once. This runs in continuous mode without stopping.
		delay: 0,
		runOnce: true
	},
	{
		name: 'Gang Manager',
		script: 'gang-manager.js',
		args: ['-c'],
		// Run immediately and only once. This runs in continuous mode without stopping.
		delay: 0,
		runOnce: true
	},
	{
		name: 'Hacknet Manager',
		script: 'hacknet-manager.js',
		args: ['-c', '--max-payoff-time', '1h'],
		// Run immediately and only once. It'll run until it's done.
		delay: 0,
		runOnce: true,
	},
	{
		name: 'Hacknet Manager',
		script: 'hacknet-manager.js',
		args: ['-c', '--max-payoff-time', '2h'],
		// Run after 15 minutes and only once. It'll run until it's done.
		delay: minutes(15),
		runOnce: true
	},
	{
		name: 'Hacknet Manager',
		script: 'hacknet-manager.js',
		args: ['-c', '--max-payoff-time', '4h'],
		// Run after an hour and only once. It'll run until it's done.
		delay: hours(1),
		runOnce: true
	},
	{
		name: 'Contract Manager',
		script: 'contract-manager.js',
		args: ['--toast-contract'], //
		// Run immediately and then every 10 minutes.
		interval: minutes(10),
	}
];

const unscheduledServices = [];

const argsSchema = [
	['ltt', false],
	['log-to-terminal', false],
];

let startTime;
let options;
let loopInterval = seconds(1); // 1s between loops.

/** @param {NS} ns **/
export async function main(ns) {
	_ns = ns;
	_host = ns.getHostname();
	startTime = Date.now();

	options = ns.flags(argsSchema);

	_log = createLogger(ns, {
		logToTerminal: options.ltt || options['log-to-terminal'], // -t or -log-to-terminal command line arguments; logs most messages to terminal too.
		prefix: () => `[${formatTime()}] `
	});

	_log.info(`Daemon started`);
	disableLogs(ns, silencedServices);

	checkServicesConfigs(); // Check if services are configured correctly.

	while (startScheduledServices()) {
		await ns.sleep(loopInterval);
	}

	if (!scheduledServices.length) {
		_log.info('No more services to start. Stopping daemon.');
	}
}

/**
 * Starts scheduled services according to their configurations.
 * @param {Object[]}
 */
function startScheduledServices() {
	let thingsToDo = true;
	const unschedule = [];

	scheduledServices.forEach((service, i) => {
		let {name, script, args = [], interval, delay, runOnce, lastRun, tailLog = false} = service;

		if (serviceShouldRun(service)) {
			if (_ns.getScriptRam(script) < (_ns.getServerMaxRam(_host) - _ns.getServerUsedRam(_host))) {
				service.scriptInsufficientMemCount = 0;
				let pid = _ns.exec(script, _host, 1, ...args);

				if (pid) {
					_log.info(`Started scheduled service ${name} (${script})${interval ? `; it will run again after ${formatDuration(interval)}`: ''}`);
					lastRun = service.lastRun = Date.now();

					if (runOnce) {
						unschedule.push(service);
					}
					if (tailLog) {
						_ns.tail(pid);
					}
				} else {
					_log.error(`Scheduled service ${name} (${script}) could not be started!`);
				}
			} else {
				service.scriptInsufficientMemCount = 1 + (service.scriptInsufficientMemCount || 0);

				if (service.scriptInsufficientMemCount % 10 === 0) {
					_log.warn(`Cannot start service ${name} (${script}) because there isn't enough memory available right now. Trying again later.`);
				}
			}
		}
		// else: service shouldn't run now.
	});

	if (unschedule.length) {
		// Unschedule services that have run. Keep them in a separate array, because reasons, I don't know, leave me alone.
		Arrays.include(unscheduledServices, unschedule);
		Arrays.erase(scheduledServices, ...unschedule); // Remove unscheduled.

		thingsToDo = scheduledServices.length > 0;
	}

	return thingsToDo; // Do we have more things to do?
}

function checkServicesConfigs() {
	const faulyServices = [];

	for (const service of scheduledServices) {
		let incorrect = false;

		if (service.lastRun) {
			_log.error(`service ${service.name} was unscheduled because the property 'lastRun' was preconfigured. Please remove it.`);
			incorrect = true;
		}

		if (!service.runOnce && !service.interval) {
			_log.error(`service ${service.name} was unscheduled because it is missing either a \`runOnce: true\` or an interval; Please configure one.`);
			incorrect = true;
		}

		if (service.runOnce && service.interval) {
			_log.warn(`service ${service.name} has runOnce: true and an interval; interval will be ignored. Did you mean to use a delay?`);
			// technically incorrect, but we'll allow it for now. It's just weird to configure both.
		}

		if (incorrect) {
			faulyServices.push(incorrect);
		}
	}
	
	if (faulyServices.length) {
		Arrays.erase(scheduledServices, ...faulyServices);
	}
}

function serviceShouldRun(service) {
	let {name, script, args = [], interval, delay, runOnce, lastRun} = service;

	if (_ns.isRunning(script, _host, args)) {
		// Safety catch. Could happen when a script is scheduled at multiple services
		// or when a service runs long but has a short interval.
		// Just return false and it'll start the next iteration when this one has finished running.
		_log.warn(`an instance of service ${name} (args=[${args.join(', ')}]) is already running on ${_host}`);
		return false;
	}

	if (runOnce && lastRun) {
		// Safety catch. This shouldn't happen. Remove when certain is doesn't.
		_log.error(`service ${name} is runOnce and has already run once. It should've been unscheduled!`);
		return false;
	}

	if (lastRun) {
		return interval <= Date.now() - lastRun; // Is this service up for another start?
	}
	if (delay) {
		return (Date.now() - startTime) >= delay; // Has we passed the delay time?
	}
	return true; // Service didn't run before and has no delay, so run immediately.
}