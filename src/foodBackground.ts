class FoodBackground {
	private stepsToRegen = 5000;
	private xy2LastAccessTime: D3.Map<number>;
	private _eatenThisTurn: number[][];


	constructor(public radius: number) {
		this.xy2LastAccessTime = d3.map();
		this._eatenThisTurn = [];
	}

	public eatenThisTurn(): number[][] {
		var copy = this._eatenThisTurn;
		this._eatenThisTurn = [];
		return copy;
	}

	public getFoodAtTile(step: number, x: number, y: number) {
		var s = x.toString() + "," + y.toString();
		var out: number;
		if (this.xy2LastAccessTime.has(s)) {
			out = (step - this.xy2LastAccessTime.get(s)) / this.stepsToRegen;
			out = Math.min(out, 1);
		} else {
			out = 0.5;
		}
		this.xy2LastAccessTime.set(s, step);
		this._eatenThisTurn.push([x,y]);
		return out;
	}

	public getFood(position: Vector, step: number) {
		var x = Math.round(position.x);
		var y = Math.round(position.y);
		var food = 0;
		// food += this.getFoodAtTile(step, x-1, y-1);
		// food += this.getFoodAtTile(step, x, y-1);
		// food += this.getFoodAtTile(step, x+1, y-1);
		// food += this.getFoodAtTile(step, x-1, y);
		food += this.getFoodAtTile(step, x, y);
		// food += this.getFoodAtTile(step, x, y+1);
		// food += this.getFoodAtTile(step, x+1, y-1);
		// food += this.getFoodAtTile(step, x+1, y);
		// food += this.getFoodAtTile(step, x+1, y+1);
		return food;
	}
}