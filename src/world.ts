var NUM_NEIGHBORS_TO_SHOW = 7;

class World {
	private boids: _Boid[];
	private radius: number;
	public nSteps = 0;

	constructor(width: number, height: number, private renderer: Renderer, nBoids: number) {
		this.radius = Math.min(width, height) / 2;
		var standardFlocking = {seperationWeight: 1, alignmentWeight: 1, cohesionWeight: 1};
		var standardGenetics = {preyFlocking: standardFlocking, predatorFlocking: standardFlocking, targetFlocking: standardFlocking};
		this.boids = [];
		for (var i=0; i<nBoids; i++) {
			this.boids.push(new Prey(newVector().randomize(this.radius*Math.random()), newVector().randomize(), standardGenetics));
		}
	}

	public neighbors(b: _Boid, showPredators: boolean) {
		if (showPredators) {
			return []; // not impelemented 
		}
		var compareFn = (b1: _Boid, b2: _Boid) => {
			var d1 = b1.position.distance(b.position);
			var d2 = b2.position.distance(b.position);
			return d1 - d2;
		}
		return this.boids.slice().sort(compareFn).slice(0, NUM_NEIGHBORS_TO_SHOW);
	}

	public step() {
		this.boids.forEach((b) => {
			b.accelerate(this);
		});

		this.boids.forEach((b) => {
			b.step(this.radius);
		});
		this.nSteps++;
		console.log(this.nSteps);
	}

	public render() {
		this.renderer.render(this.boids);
	}
}