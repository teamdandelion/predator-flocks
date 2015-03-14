class World {
	private boids: _Boid[];
	private radius: number;
	public nSteps = 0;

	constructor(width: number, height: number, private renderer: Renderer, nBoids: number) {
		this.radius = Math.min(width, height) / 2;
		var standardFlocking = {seperationWeight: 1, alignmentWeight: 1, cohesionWeight: 1};
		var standardGenetics = {preyFlocking: standardFlocking, predatorFlocking: standardFlocking, targetFlocking: standardFlocking};
		for (var i=0; i<nBoids; i++) {
			this.boids.push(new Prey(newVector(), newVector(), standardGenetics));
		}
	}

	public neighbors(b: _Boid, showPredators: boolean) {
		if (showPredators) {
			console.error("not implemented");
		}
		return this.boids;
	}

	public step() {
		this.boids.forEach((b) => {
			b.accelerate(this);
		});

		this.boids.forEach((b) => {
			b.step(this.radius);
		});
		this.nSteps++;
	}

	public render() {
		this.renderer.render(this.boids);
	}
}