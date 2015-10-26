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
	constructor(private width: number, private height: number, div: Element) {
		this.div = d3.select(div);
		this.canvas = this.div.append("canvas").attr("width", this.width).attr("height", this.height).node();
		this.svg = this.div.append("svg").attr("width", this.width).attr("height", this.height);
		this.prey = this.svg.append("g").classed("prey",true);
		this.predators = this.svg.append("g").classed("predators", true);

		var ctx = this.canvas.getContext('2d');
		ctx.beginPath();
		ctx.rect(0, 0, this.width, this.height);
		// ctx.arc(this.radius, this.radius, this.radius, 0, 2 * Math.PI, false);
		ctx.fillStyle = "rgb(255,255,255)"
		ctx.fill();
		ctx.fillStyle = "rgba(0, 255, 0," +  C.FOOD_STARTING_LEVEL + ")";
		ctx.fill();
		ctx.closePath()
	}

	public renderBoids(boids: Boid[], isPrey: boolean) {
		var selection = isPrey ? this.prey : this.predators;

		var colorF = (b: Boid) => {
			return "hsl(" + b.genetics.color + ",100%, 50%)";
		}

		var update = selection.selectAll("circle")
			.data(boids, (b) => b.boidID);
		update.enter()
			.append("circle")
			.attr("r", (d) => d.radius)
			.attr("fill", colorF);
		update.attr("cx", (d) => d.position.x)
			  .attr("cy", (d) => d.position.y);

		update.exit().remove();

	}

	private corpsesToRender: Boid[] = [];
	// Wrapper method, since I prefer not to have other classes directly touching renderer2D's data structs
	public addCorpseToRender(boid: Boid) {
		this.corpsesToRender.push(boid);
	}

	public renderCorpses() {
		var ctx = this.canvas.getContext('2d');
		this.corpsesToRender.forEach((b) => {
			ctx.fillStyle = "rgb(0,0,0)"
			ctx.beginPath();
			ctx.arc(b.position.x, b.position.y, b.radius, 0, 2*Math.PI, false);
			ctx.fill();
			ctx.closePath();
		});
		this.corpsesToRender = [];
	}

	public renderBackground(f: FoodBackground) {
		var ctx = this.canvas.getContext('2d');
		ctx.beginPath();
		ctx.rect(0, 0, this.width, this.height);
		// ctx.arc(this.radius, this.radius, this.radius, 0, 2 * Math.PI, false);
		if (this.foodCounter++ === Math.round(C.FOOD_STEPS_TO_REGEN / 100)) {
			ctx.fillStyle = "rgba(0,255,0, 0.01)"
			ctx.fill();
			ctx.closePath();
			this.foodCounter = 0;
		}

		var eatenThisTurn = f.eatenThisTurn();
		eatenThisTurn.forEach((xy: number[]) => {
			ctx.fillStyle = "rgba(255,255,255," + C.FOOD_GRAZED_PER_STEP + ")"
			ctx.beginPath();
			ctx.arc(xy[0], xy[1], 1, 0, 2*Math.PI, false);
			ctx.fill();
			ctx.closePath();
		});
	}
}
