class GridNeighborDetector {
	private cells: string[][][];
	private id2CellIndex: D3.Map<string>;

	/* 
		This class exists to speedup neighbor detection for the flocking algorithm.
		A naive method is best-case O(n^2) since for each flock, we need to test distance against
		every other flock to find which ones are nearby.

		This class divides the space into a grid, such that if a boid `x` is within neighbor 
		distance of another boid `y`, it is guaranteed that the grid cell containing `y` is in the Moore 
		neighborhood of the grid cel containing `x`. Thus we can quickly retrieve all the possible neighbors,
		i.e. those in the 9 nearby cells, and (externally to this class) do distance computations on them.

		The worst case performance would still be O(n^2) (if all boids are in the same grid) but the average
		performance should be much better (effectively constant if the boids are seperating). 
	*/
	constructor(private width: number, private height: number, private cellRadius: number) {
		if (width <=0 || height <=0 || cellRadius <=0 ) {
			console.error("Invalid input to GridNeighborDetector constructor");
		}
		this.id2CellIndex = d3.map();
		this.cells = [];
		var xCells = Math.ceil(width/cellRadius);
		var yCells = Math.ceil(height/cellRadius);
		for (var i=0; i<xCells; i++) {
			var row = [];
			for (var j=0; j<yCells; j++) {
				row.push([]);
			}
			this.cells.push(row);
		}
	}

	/* 
		Get all of the possible neighbors of given ID. If another ID is located within `cellRadius` 
		of the given ID, it is guaranteed to be returned. Some IDs that are not located within `cellRadius`
		may also be returned.
		In practice, if cellRadius >= neighborRadius, this method is a good way of finding neighbors for
		flocking.
		Note that `id` will always be one of the ids returned, so you may need to manually filter it out later.
		*/
	public neighbors(id: string): string[] {
		if (!this.id2CellIndex.has(id)) {
			console.error("Invalid id", id, "passed to GND.neighbors");
		}
		var neighbors = [];
		var ij = this.id2CellIndex.get(id);
		var i = +(ij.split(",")[0]);
		var j = +(ij.split(",")[1]);
		for (var iOffset = -1; iOffset <= 1; iOffset++) {
			if (i+iOffset < 0 || i+iOffset >= this.cells.length) continue;
			for (var jOffset = -1; jOffset <= 1; jOffset++) {
				if (j+jOffset < 0 || j+jOffset >= this.cells[0].length) continue;
				var cell = this.cells[i+iOffset][j+jOffset];
				neighbors = neighbors.concat(cell);
			}
		}
		return neighbors;
	}

	/*
		Add the given id into the neighborDetector at given x and y coordinates.
		If the id is already present, it will be moved into the new location.
	*/
	public add(id: string, x: number, y: number): GridNeighborDetector {
		if (x < 0 || x > this.width || y <0 || y > this.height) {
			console.error("Bad input id=", id, "x=", x, "y=", y, " to GND.add");
		}
		var i = Math.floor(x / this.cellRadius);
		var j = Math.floor(y / this.cellRadius);
		var ij = i.toString() + "," + j.toString();
		if (this.id2CellIndex.has(id)) {
			if (this.id2CellIndex.get(id) === ij) {
				// coordinate has moved, but is still in the same cell. no change needed
				return this;
			} else {
				// coordinate has moved into a new cell; remove the old position
				this.remove(id);
			}
		}
		this.cells[i][j].push(id);
		this.id2CellIndex.set(id, ij);
		return this;
	}

	/*
		Remove the given id from the neighborDetector.
	*/
	public remove(id: string): GridNeighborDetector {
		var ij = this.id2CellIndex.get(id);
		var i = +(ij.split(",")[0]);
		var j = +(ij.split(",")[1]);
		var cell = this.cells[i][j];
		var idx = cell.indexOf(id);
		if (idx === -1) {
			console.error("invalid index in GND.remove");
		}
		cell.splice(idx, 1);
		this.id2CellIndex.remove(id);
		return this;
	}
}

var testGND = (() => {
	var assertIsNeighbor = (x1: number, y1: number, x2: number, y2: number) => {
		var gnd = new GridNeighborDetector(400, 400, 50);
		var id1 = x1 + "," + y1;
		var id2 = x2 + "," + y2;
		// hack around the protection on the _add method so we can test without coordinate conversion
		gnd.add(id1, x1, y1);
		gnd.add(id2, x2, y2);
		if (gnd.neighbors(id1).length != 2) {
			console.error("expected", id1, "to be neighbor of", id2);
		}
	}

	var assertNotNeighbor = (x1: number, y1: number, x2: number, y2: number) => {
		var gnd = new GridNeighborDetector(400, 400, 50);
		var id1 = x1 + "," + y1;
		var id2 = x2 + "," + y2;
		gnd.add(id1, x1, y1);
		gnd.add(id2, x2, y2);
		if (gnd.neighbors(id1).length != 1) {
			console.error("expected", id1, "not to be neighbor of", id2);
		}
	}

	assertIsNeighbor(0,0, 50,50);
	assertIsNeighbor(0,0, 99,99);
	assertIsNeighbor(0,0, 0,99);
	assertIsNeighbor(0,0, 0,1);

	assertNotNeighbor(0,0, 100, 100);
	assertNotNeighbor(0,0, 0, 100);
})();
