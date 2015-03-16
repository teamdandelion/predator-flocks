/// <reference path="../typings/d3/d3.d.ts" />
var PREY_SIZE = 1;
var PREDATOR_SIZE = 2;

class Renderer2D implements Renderer {
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
		ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
		ctx.fill();
		ctx.closePath()
	}

	public renderPrey(boids: Prey[]): Renderer {
		var update = this.prey.selectAll("circle")
			.data(boids, (b) => b.boidID);
		update.enter()
			.append("circle")
			.attr("r", (d) => d.radius)
			.attr("fill", (d) => d.color);
		update.attr("cx", (d) => d.position.x + this.radius)
			  .attr("cy", (d) => d.position.y + this.radius);

		update.exit().remove();

		return this;
	}

	public renderPredators(boids: Predator[]): Renderer {
		var update = this.predators.selectAll("circle")
			.data(boids, (b) => b.boidID);
		update.enter()
			.append("circle")
			.attr("r", (d) => d.radius)
			.attr("fill", (d) => d.color);
		update.attr("cx", (d) => d.position.x + this.radius)
			  .attr("cy", (d) => d.position.y + this.radius);
		update.exit().remove();

		return this;
	}

	public renderBackground(f: FoodBackground) {
		var ctx = this.canvas.getContext('2d');
		ctx.beginPath();
		ctx.arc(this.radius, this.radius, this.radius, 0, 2 * Math.PI, false);
		if (this.foodCounter++ === 50) {
			ctx.fillStyle = "rgba(0,255,0, 0.01)"
			ctx.fill();
			ctx.closePath();
			this.foodCounter = 0;
		}

		var eatenThisTurn = f.eatenThisTurn();
		ctx.fillStyle = "rgb(255,255,255)"
		eatenThisTurn.forEach((xy: number[]) => {
			ctx.beginPath();
			ctx.arc(xy[0] + this.radius, xy[1] + this.radius, 1, 0, 2*Math.PI, false);
			ctx.fill();
			ctx.closePath();
		});
		return this;
	}
}
