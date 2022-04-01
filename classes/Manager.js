import NamespaceHolder from '/classes/NamespaceHolder.js';
import {
	// Arrays,
	seconds,
	// minutes,
	// hours,
	createLogger,
} from '/util-helpers.js';
import {
	formatDuration,
	formatTime
} from '/util-formatters.js';

/**
 * A program that manages a specific task.
 */
export default class Manager extends NamespaceHolder {
    static #defaults = {
        interval: seconds(1)
    }

    /**
     * The name of this manager.
     * @type {string}
     */
    #name;

    /**
     * Options. Flags passed to the constructor.
     * @type {Object}
     */
    #options;

    /**
     * Logger.
     * @type {Function}
     */
    #_logger;

    /**
     * Constructor
     * @param {Object} config Config object.
     * @param {number} config.interval Cycle interval.
     * @param {boolean} config.log-to-terminal Option: log to terminal.
     * @param {boolean} config.ltt Option: log to terminal. Alias for log-to-terminal.
     */
    constructor(config) {
        const {ns, name, options} = config;

        super(ns);
        this.#name = name;
        this.#options = options;

        this.#disableAllLogs();
    }

    /**
     * Cycle interval.
     * @type {number}
     */
    get interval() {
        return this.getOption('interval');
    }

    /**
     * The name of this manager.
     * @type {string}
     */
    get name() {
        return this.#name;
    }

    /**
     * Starts running.
     */
    async start() {
        this.log(`${this.#name} started`);

        if (await this.beforeMainLoop()) {

            while (await this.mainLoop()) {
                await this.#sleepCycle();
            }

            await this.afterMainLoop();
        }
        
        this.log(`${this.#name} Done`);
    }

    /**
     * This method is executed ONCE, before the main loop is started. Returning `false`
     * prevents `mainLoop` and `afterMainLoop` from running and quits the program.
     */
    async beforeMainLoop() {
        // This can be implemented by subclasses.
        return true;
    }

    /**
     * Program main loop. This is executed every cycle until it returns `false`.
     * @returns {boolean} A truthy value to continue; a falsy value to stop.
     */
    async mainLoop() {
        // This should be implemented by subclasses.
        return false;
    }

    /**
     * This method is executed ONCE, after `mainLoop` finished running, i.e. returns `false`.
     */
    async afterMainLoop() {
        // This can be implemented by subclasses.
    }

    /**
     * Gets the option value.
     * @param {string} option The option name.
     */
    getOption(option) {
        return this.#options[option] || Manager.#defaults[option] || null;
    }

    /**
     * Logs a message.
     * @param {string} message The message to log.
     */
    log(message) {
        this.#logger.info(message);
    }

    /**
     * Logs an warning message.
     * @param {string} message The message to log.
     */
    warn(message) {
        this.#logger.warn(message);
    }

    /**
     * Logs an error message.
     * @param {string} message The message to log.
     */
    error(message) {
        this.#logger.error(message);
    }

    /**
     * Logger function.
     * @type {function}
     */
    get #logger() {
        return this.#_logger || (this.#_logger =  createLogger(this.ns, {
            logToTerminal: this.getOption('ltt') || this.getOption('log-to-terminal'), // -t or -log-to-terminal command line arguments; logs most messages to terminal too.
            prefix: () => `[${formatTime()}] `
        }));
    }

    /**
     * Sleeps for 1 cycle.
     */
    async #sleepCycle() {
        await this.ns.sleep(this.interval);
    }

    /**
     * Disables all logs.
     */
    #disableAllLogs() {
        this.ns.disableLog('ALL');
    }
}