/// <reference path="../typings/d3/d3.d.ts" />
var PREY_SIZE = 1;
var PREDATOR_SIZE = 2;

class Renderer2D {
	private div: D3.Selection;
	private canvas: any; // it's a canvas node
	private svg: D3.Selection;
	private prey: D3.Selection;
	private predators: D3.Selection;
	private foodCounter = 0;
	constructor(private radius: number, divID: string) {
		this.div = d3.select(divID);
		this.canvas = this.div.append("canvas").attr("width", this.radius*2).attr("height", this.radius*2).node();
		this.svg = this.div.append("svg").attr("width", this.radius*2).attr("height", this.radius*2);
		this.prey = this.svg.append("g").classed("prey",true);
		this.predators = this.svg.append("g").classed("predators", true);

		var ctx = this.canvas.getContext('2d');
		ctx.beginPath();
		ctx.arc(this.radius, this.radius, this.radius, 0, 2 * Math.PI, false);
		ctx.fillStyle = "rgb(255,255,255)"
		ctx.fill();
		ctx.fillStyle = "rgba(0, 255, 0," +  C.FOOD_STARTING_LEVEL + ")";
		ctx.fill();
		ctx.closePath()
	}

	public renderBoids(boids: _Boid[], isPrey: boolean) {
		var selection = isPrey ? this.prey : this.predators;

		var colorF = (b: _Boid) => {
			return "rgb(" + b.genetics.r + "," + b.genetics.g + ","+ b.genetics.b + ")";
		}

		var update = selection.selectAll("circle")
			.data(boids, (b) => b.boidID);
		update.enter()
			.append("circle")
			.attr("r", (d) => d.radius)
			.attr("fill", colorF);
		update.attr("cx", (d) => d.position.x + this.radius)
			  .attr("cy", (d) => d.position.y + this.radius);

		update.exit().remove();

		return this;
	}

	public renderBackground(f: FoodBackground, boidsDied: _Boid[]) {
		var ctx = this.canvas.getContext('2d');
		ctx.beginPath();
		ctx.arc(this.radius, this.radius, this.radius, 0, 2 * Math.PI, false);
		if (this.foodCounter++ === Math.round(C.FOOD_STEPS_TO_REGEN / 100)) {
			ctx.fillStyle = "rgba(0,255,0, 0.01)"
			ctx.fill();
			ctx.closePath();
			this.foodCounter = 0;
		}

		var eatenThisTurn = f.eatenThisTurn();
		eatenThisTurn.forEach((xy: number[]) => {
			ctx.fillStyle = "rgb(255,255,255)"
			ctx.beginPath();
			ctx.arc(xy[0] + this.radius, xy[1] + this.radius, 1, 0, 2*Math.PI, false);
			ctx.fill();
			ctx.closePath();

		boidsDied.forEach((b) => {

			ctx.fillStyle = "rgb(0,0,0)"
			ctx.beginPath();
			ctx.arc(b.position.x + this.radius, b.position.y + this.radius, b.radius, 0, 2*Math.PI, false);
			ctx.fill();
			ctx.closePath();
		});
			// // add a bigger but lower opacity circle for antialiasing
			// ctx.fillStyle = "rgba(255,255,255, 0.5)"
			// ctx.beginPath();
			// ctx.arc(xy[0] + this.radius, xy[1] + this.radius, 2, 0, 2*Math.PI, false);
			// ctx.fill();
			// ctx.closePath();

		});
		return this;
	}
}
