import NamespaceHolder from '/classes/NamespaceHolder.js';

/**
 * A lightweight alternative to Server that implements most properties that `Server` has.
 * 
 * This uses methods that are cheaper combined (750MB) than ns.getServer() (2GB).
 */
export default class ServerLight extends NamespaceHolder {
	/**
	 * Server hostname.
	 * @type {string}
	 */
	#hostname;

	/** ctor */
	constructor(_ns, hostname) {
		super(_ns);
		this.#hostname = hostname;
	}

	/**
	 * The server's current security level.
	 * @type {number}
	 */
	get securityLevel() {
		return this.ns.getServerSecurityLevel(this.hostname); // 100MB.
	}

	/**
	 * The server's current security level.
	 * 
	 * Alias for `securityLevel`
	 * @type {number}
	 */
	get hackDifficulty() {
		return this.securityLevel;
	}

	/**
	 * `true` if your have root access on this server; otherwise `false`.
	 * @type {boolean}
	 */
	get hasRootAccess() {
		return this.ns.hasRootAccess(this.hostname); // 50MB.
	}

	/**
	 * `true` if your have root access on this server; otherwise `false`.
	 * 
	 * Alias for `hasRootAccess`.
	 * @type {boolean}
	 */
	get hasAdminRights() {
		return this.hasRootAccess;
	}

	/**
	 * The server's hostname.
	 * @type {string}
	 */
	get hostname() {
		return this.#hostname;
	}

	/**
	 * The max RAM on a server, in GB.
	 * @type {number}
	 */
	get maxRam() {
		return this.ns.getServerMaxRam(this.hostname); // 50MB
	}

	/**
	 * The minimum security level of the server.
	 * @type {number}
	 */
	get minSecurityLevel() {
		return this.ns.getServerMinSecurityLevel(this.hostname); // 100MB
	}

	/**
	 * The minimum security level of the server.
	 * 
	 * Alias for `minSecurityLevel`.
	 * @type {number}
	 */
	get minDifficulty() {
		return this.minSecurityLevel;
	}

	/**
	 * The money available on the server.
	 * @type {number}
	 */
	get moneyAvailable() {
		return this.ns.getServerMoneyAvailable(this.hostname); // 100MB
	}

	/**
	 * The maximum money available on the server.
	 * @type {number}
	 */
	get maxMoney() {
		return this.ns.getServerMaxMoney(this.hostname); // 100MB
	}

	/**
	 * The maximum money available on the server.
	 * 
	 * Alias for `maxMoney`.
	 * @type {number}
	 */
	get moneyMax() {
		return this.maxMoney;
	}

	/**
	 * The number of open ports required to successfully run `NUKE.exe` on the specified server.
	 * @type {number}
	 */
	get numOpenPortsRequired() {
		return this.ns.getServerNumPortsRequired(this.hostname); // 100MB
	}

	/**
	 * The used RAM on the server, in GB.
	 * @type {number}
	 */
	get usedRam() {
		return this.ns.getServerUsedRam(this.hostname); // 50MB
	}

	/**
	 * The used RAM on the server, in GB.
	 * 
	 * Alias for `usedRam`.
	 * @type {number}
	 */
	get ramUsed() {
		return this.usedRam;
	}

	/**
	 * The available RAM on the server, in GB. Available RAM = Max RAM - Used RAM.
	 * @type {number}
	 */
	get ramAvailable() {
		return this.maxRam - this.usedRam;
	}

	/**
	 * The required hacking level of the server.
	 * @type {number}
	 */
	get requiredHackingLevel() {
		return this.ns.getServerRequiredHackingLevel(this.hostname); // 100MB
	}

	/**
	 * The required hacking level of the server.
	 * 
	 * Alias for `requiredHackingLevel`.
	 * @type {number}
	 */
	get requiredHackingSkill() {
		return this.requiredHackingLevel;
	}
}