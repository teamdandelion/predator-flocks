var NUM_NEIGHBORS_TO_SHOW = 7;

class World {
	private boids: _Boid[];
	public nSteps = 0;

	constructor(public radius: number, private renderer: Renderer) {
		var standardFlocking = {seperationWeight: 1, alignmentWeight: 1, cohesionWeight: 1};
		var standardGenetics = {preyFlocking: standardFlocking, predatorFlocking: standardFlocking, targetFlocking: standardFlocking};
		this.boids = [];
	}

	public addRandomPrey() {
		var position = newVector().randomize(this.radius * Math.random()); // random within radius
		var velocity = newVector().randomize(Prey.SPEED_FACTOR * BASE_SPEED * Math.random()); 
		var genetics = sensibleGenetics();
		var p = new Prey(position, velocity, genetics);
		this.boids.push(p);
	}

	public neighbors(b: _Boid, showPredators: boolean) {
		if (showPredators) {
			return []; // not impelemented 
		}
		var compareFn = (b1: _Boid, b2: _Boid) => {
			var d1 = b1.position.distance(b.position, this.radius);
			var d2 = b2.position.distance(b.position, this.radius);
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
	}

	public render() {
		this.renderer.render(this.boids);
	}
}