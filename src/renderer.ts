interface Renderer {
	renderPrey(boids: _Boid[]): Renderer;
	renderPredators(boids: _Boid[]): Renderer;
}