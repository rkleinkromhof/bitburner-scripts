import {Store} from '/x/data/Store.js';

/**
 * A Store that holds Array data
 */
export default class ArrayStore extends Store {
	#data;

	constructor(data = []) {
		this.#data = Array.prototype.slice.call(data);
	}

	set data(value) {
		this.#data = Array.prototype.slice.call(data);
	}

	get data() {
		return this.#data;
	}
}