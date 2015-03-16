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

		var lastAccessTime: number;
		if (!this.xy2LastAccessTime.has(s)) {
			// set so if it were accessed at time 0, it would have STARTING_LEVEL
			// (0 - lastTime) / STEPS_TO_REGEN = STARTING_LEVEL
			// -lastTime = STARTING_LEVEL * STEPS_TO_REGEN
			lastAccessTime = Math.round(-C.FOOD_STARTING_LEVEL * C.FOOD_STEPS_TO_REGEN);
		} else {
			lastAccessTime = this.xy2LastAccessTime.get(s);
		}
		var food = step - lastAccessTime / C.FOOD_STEPS_TO_REGEN;
		food = Math.min(food, 1);
		this.xy2LastAccessTime.set(s, step);
		this._eatenThisTurn.push([x,y]);
		return food;
	}

	public getFood(position: Vector, step: number) {
		var x = Math.round(position.x);
		var y = Math.round(position.y);
		var food = 0;
		// food += this.getFoodAtTile(step, x-1, y-1);
		food += this.getFoodAtTile(step, x, y-1);
		// food += this.getFoodAtTile(step, x+1, y-1);
		food += this.getFoodAtTile(step, x-1, y);
		food += this.getFoodAtTile(step, x, y);
		food += this.getFoodAtTile(step, x, y+1);
		// food += this.getFoodAtTile(step, x+1, y-1);
		food += this.getFoodAtTile(step, x+1, y);
		// food += this.getFoodAtTile(step, x+1, y+1);
		return food;
	}
}