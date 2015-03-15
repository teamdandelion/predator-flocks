/// <reference path="../typings/d3/d3.d.ts" />
class Renderer2D implements Renderer {
	private element: D3.Selection;
	constructor(element: any) {
		this.element = element.node ? element : d3.select(element);
	}

	render(boids: _Boid[]): Renderer {
		var update = this.element.selectAll("circle")
			.data(boids, (b) => b.boidID);
		update.enter()
			.append("circle")
			.attr("r", 2)
			.attr("fill", "blue");
		update.attr("cx", (d) => d.position.x + 400)
			  .attr("cy", (d) => d.position.y + 400);

		return this;
	}
}