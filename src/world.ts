var NUM_NEIGHBORS_TO_SHOW = 7;
var RANGE_TO_CONSUME = 5;

class World {
	private predators: D3.Map<Predator>; // ids of the predators
	private prey: D3.Map<Prey>;
	private foodBackground: FoodBackground;
	public nSteps = 0;

	constructor(public radius: number, private renderer: Renderer) {
		var standardFlocking = {seperationWeight: 1, alignmentWeight: 1, cohesionWeight: 1};
		var standardGenetics = {preyFlocking: standardFlocking, predatorFlocking: standardFlocking, targetFlocking: standardFlocking};
		this.predators = d3.map();
		this.prey = d3.map();
		this.foodBackground = new FoodBackground(this.radius)
	}

	public addRandomPrey() {
		var position = newVector().randomize(this.radius * Math.random()); // random within radius
		var velocity = newVector().randomize(Prey.SPEED_FACTOR * BASE_SPEED * Math.random()); 
		var genetics = randomGenetics();
		var p = new Prey(position, velocity, genetics);
		p.color = "green";
		this.addBoid(p);
	}

	public addSensiblePrey() {
		var position = newVector().randomize(this.radius * Math.random()); // random within radius
		var velocity = newVector().randomize(Prey.SPEED_FACTOR * BASE_SPEED * Math.random()); 
		var genetics = preyGenetics();
		var p = new Prey(position, velocity, genetics);
		p.color = "blue";
		this.addBoid(p);
	}

	public addRandomPredator() {
		var position = newVector().randomize(this.radius * Math.random()); // random within radius
		var velocity = newVector().randomize(Predator.SPEED_FACTOR * BASE_SPEED * Math.random()); 
		var genetics = predatorGenetics();
		var p = new Predator(position, velocity, genetics);
		p.color = "red";
		this.addBoid(p);
	}

	public addBoid(b: _Boid) {
		var addTo: D3.Map<_Boid> = b.isPrey ? this.prey : this.predators;
		var id = b.boidID;
		if (addTo.has(id)) {
			console.error("Duplicate boid with id", id);
		}
		addTo.set(id, b);
	}

	public neighbors(b: _Boid, prey: boolean) {
		var findFrom = prey ? this.prey : this.predators;
		var inRange = (x: _Boid) => b.position.distance(x.position, 0) <= NEIGHBOR_RADIUS;
		var compareFn = (b1: _Boid, b2: _Boid) => {
			var d1 = b1.position.distance(b.position, this.radius);
			var d2 = b2.position.distance(b.position, this.radius);
			return d1 - d2;
		}
		return findFrom.values().filter(inRange).sort(compareFn).slice(0, NUM_NEIGHBORS_TO_SHOW);
	}

	public removeBoid(b: _Boid) {
		var removeFrom = b.isPrey ? this.prey : this.predators;
		if (!removeFrom.has(b.boidID)) {
			console.error("tried to remove non-existent boid", b.boidID);
		}
		removeFrom.remove(b.boidID);
	}

	private reproduceBoid(mom: _Boid) {
		var minDistance = Infinity;
		var dad: _Boid;
		var potentialParents = mom.isPrey ? this.prey.values() : this.predators.values();
		if (potentialParents.length == 1) {
			dad = mom; // awwwwkward....
		} else {
			potentialParents.forEach((p: _Boid) => {
				var dist = p.position.distance(mom.position, 0);
				if (p != mom && dist < minDistance) {
					minDistance = dist;
					dad = p;
				}
			});
		}
		var newGenetics = mom.genetics.reproduceWith(dad.genetics);
		var cons = mom.isPrey ? Prey : Predator;
		var child = new cons(mom.position, mom.velocity, newGenetics);
		this.addBoid(child);
		child.food = mom.reproduction_threshold / 2;
		mom.food -= mom.reproduction_threshold / 2;
	}

	public step() {
		var allBoids = this.prey.values().concat(this.predators.values());
		allBoids.forEach((b) => {
			b.accelerate(this);
		});

		allBoids.forEach((b) => {
			b.step(this.radius);
		});

		this.prey.values().forEach((p: Prey) => {
			p.food += this.foodBackground.getFood(p.position, this.nSteps);
		});

		this.predators.values().forEach((d: Predator) => {
			this.prey.values().forEach((y: Prey) => {
				if (d.position.distance(y.position, 0) <= RANGE_TO_CONSUME) {
					d.food+= y.food;
					this.removeBoid(y);
				}
			});
		});

		allBoids = this.prey.values().concat(this.predators.values()); // since we removed some already
		allBoids.forEach((b) => {
			b.food -= b.food_burn;
			if (b.food > b.reproduction_threshold) {
				this.reproduceBoid(b);
			} else if (b.food < 0) {
				this.removeBoid(b);
			}
		});

		this.nSteps++;
	}

	public render() {
		this.renderer.renderPrey(this.prey.values());
		this.renderer.renderPredators(this.predators.values());
	}
}