import {Grid} from './Grid.js'

/**
 * haXX - A Bitburner Framework for Haxx0rxz!!11one
 */
export class X {
	version = 0.1


}

X.Grid = Grid;

let x = (function() {
	let version = 0.1;
	let instance = new X();

	instance.version = version;



	return instance;
})();

export default x; // TODO Check... is this really how it works?