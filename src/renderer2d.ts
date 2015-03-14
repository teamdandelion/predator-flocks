/// <reference path="../typings/d3/d3.d.ts" />
class Renderer2D implements Renderer {
	private element: D3.Selection;
	constructor(element: any) {
		this.element = element.node ? element : d3.select(element);
	}

	render(boids: _Boid[]): Renderer {
		this.element.data(boids, (b) => b.boidID);
		return this;
	}
}