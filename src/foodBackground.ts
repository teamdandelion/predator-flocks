interface FoodAccessRecord {
	lastAccessTimestep: number;
	proportionLeft: number;
}

class FoodBackground {
	private stepsToRegen = 5000;
	private xy2LastAccessTime: D3.Map<FoodAccessRecord>;
	private _eatenThisTurn: number[][];


	constructor() {
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

		var accessRecord: FoodAccessRecord;
		if (!this.xy2LastAccessTime.has(s)) {
			// set so if it were accessed at time 0, it would have STARTING_LEVEL
			// (0 - lastTime) / STEPS_TO_REGEN = STARTING_LEVEL
			// -lastTime = STARTING_LEVEL * STEPS_TO_REGEN
			accessRecord = {lastAccessTimestep: 0, proportionLeft: C.FOOD_STARTING_LEVEL};
		} else {
			accessRecord = this.xy2LastAccessTime.get(s);
		}
		var foodAvailable = accessRecord.proportionLeft + (step - accessRecord.lastAccessTimestep) / C.FOOD_STEPS_TO_REGEN;
		foodAvailable = Math.min(foodAvailable, 1);
		var foodTaken = Math.min(foodAvailable, C.FOOD_GRAZED_PER_STEP);
		var foodRemaining = foodAvailable - foodTaken;
		accessRecord = {lastAccessTimestep: step, proportionLeft: foodRemaining };
		this.xy2LastAccessTime.set(s, accessRecord);
		this._eatenThisTurn.push([x,y]);
		return foodTaken;
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
		return food * 4;
	}
}