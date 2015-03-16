interface Renderer {
	renderBoids(boids: _Boid[], isPrey: boolean): Renderer;
	renderBackground(f: FoodBackground): Renderer;
}