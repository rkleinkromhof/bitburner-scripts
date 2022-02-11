/**
 * A base class for classes that hold a reference to Namespace.
 */
export default class NamespaceHolder {
	/**
	 * The namespace
	 * @type {NS}
	 */
	#ns;

	/** ctor */
	constructor(_ns) {
		this.#ns = _ns;
	}

	/**
	 * The Namespace this instance was created with.
	 * @type {NS}
	 */
	get ns() {
		return this.#ns;
	}
}