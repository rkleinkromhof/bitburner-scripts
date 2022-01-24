/** @param {NS} ns **/
export async function main(ns) {
	let grid = [
		[0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 1, 0, 0, 0, 1, 0],
		[0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 1, 0, 1, 0, 0, 0],
	];

	let uniquePaths = getUniquePaths(ns, grid, 0, 0);

	ns.tprint(`Grid has ${uniquePaths.length} unique paths`);
}

function getUniquePaths(ns, grid, col, row, path = [], uniquePaths = []) {
	// ns.tprint(`Pos: ${row} x ${col}, cell: ${grid[row][col]}, path: ${path.join(', ')}`);
	let lastRow = grid.length - 1;
	let lastCol = grid[row].length - 1;

	if (grid[row][col] === 1) {
		// ns.tprint(`Found blockade at ${row} x ${col}`);
		// We've reached a blockade.
		return;
	}

	if (col === lastCol && row === lastRow) {
		// We've reached the end. Print the path taken
		uniquePaths.push(path.join(''));
	} else {
		if (col < lastCol) {
			// ns.tprint(`going right to ${row} x ${col + 1}`);
			let newPath = Array.prototype.slice.call(path);
			newPath.push('R');

			getUniquePaths(ns, grid, col + 1, row, newPath, uniquePaths);
		}
		if (row < lastRow) {
			// ns.tprint(`going down to ${row +1 } x ${col}`);
			let newPath = Array.prototype.slice.call(path);
			newPath.push('D');

			getUniquePaths(ns, grid, col, row + 1, newPath, uniquePaths);
		}
	}

	return uniquePaths;
}