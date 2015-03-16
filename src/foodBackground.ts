class FoodBackground {
	private stepsToRegen = 1000;
	private xy2LastAccessTime: D3.Map<number>;
	constructor(public radius: number) {
		this.xy2LastAccessTime = d3.map();
	}

	public getFoodAtTile(step: number, x: number, y: number) {
		var s = x.toString() + "," + y.toString();
		var out: number;
		if (this.xy2LastAccessTime.has(s)) {
			out = (step - this.xy2LastAccessTime.get(s)) / this.stepsToRegen;
			out = Math.min(out, 1);
		} else {
			out = 1;
		}
		this.xy2LastAccessTime.set(s, step);
		return out;
	}

	public getFood(position: Vector, step: number) {
		var x = Math.round(position.x);
		var y = Math.round(position.y);
		var food = 0;
		food += this.getFoodAtTile(step, x-1, y-1);
		food += this.getFoodAtTile(step, x, y-1);
		food += this.getFoodAtTile(step, x+1, y-1);
		food += this.getFoodAtTile(step, x-1, y);
		food += this.getFoodAtTile(step, x, y);
		food += this.getFoodAtTile(step, x, y+1);
		food += this.getFoodAtTile(step, x+1, y-1);
		food += this.getFoodAtTile(step, x+1, y);
		food += this.getFoodAtTile(step, x+1, y+1);
		return food/9;
	}
}