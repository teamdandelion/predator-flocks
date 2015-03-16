/// <reference path="../typings/d3/d3.d.ts" />
var PREY_SIZE = 1;
var PREDATOR_SIZE = 2;

class Renderer2D implements Renderer {
	private element: D3.Selection;
	private prey: D3.Selection;
	private predators: D3.Selection;
	constructor(private radius: number, element: any) {
		this.element = element.node ? element : d3.select(element);
		this.element.append("circle").classed("worldbounds", true).attr({
			cx: this.radius,
			cy: this.radius,
			r: this.radius,
		});
		this.prey = this.element.append("g").classed("prey",true);
		this.predators = this.element.append("g").classed("predators", true);
	}

	renderPrey(boids: Prey[]): Renderer {
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

	renderPredators(boids: Predator[]): Renderer {
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

	trianglePointsGenerator(b: _Boid): string {
		var size = b.isPrey ? PREY_SIZE : PREDATOR_SIZE;
		var x = b.position.x + this.radius;
		var y = b.position.y + this.radius;
		return "not implemented";
	}
}


// function trianglePointsGenerator(size) {
// 	return (b: _Boid) => {

// 	}
// }