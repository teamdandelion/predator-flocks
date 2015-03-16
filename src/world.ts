var NUM_NEIGHBORS_TO_SHOW = 7;
var RANGE_TO_CONSUME = 5;

class World {
	private predators: {[key: string]: Predator} ; // ids of the predators
	private prey: {[key: string]: Prey};
	private foodBackground: FoodBackground;
	private neighborDetector: GridNeighborDetector;
	public nSteps = 0;

	constructor(public radius: number, private renderer: Renderer) {
		var standardFlocking = {seperationWeight: 1, alignmentWeight: 1, cohesionWeight: 1};
		var standardGenetics = {preyFlocking: standardFlocking, predatorFlocking: standardFlocking, targetFlocking: standardFlocking};
		this.predators = {};
		this.prey = {};
		this.neighborDetector = new GridNeighborDetector(this.radius*2, this.radius*2, NEIGHBOR_RADIUS);
		this.foodBackground = new FoodBackground(this.radius)
	}

	public addRandomPrey() {
		var position = newVector().randomize(this.radius * Math.random()); // random within radius
		var velocity = newVector().randomize(Prey.SPEED_FACTOR * BASE_SPEED * Math.random()); 
		var genetics = randomGenetics();
		var p = new Prey(position, velocity, genetics);
		p.timeOfLastReproduction = Math.floor(Math.random() * p.reproduction_counter);
		p.color = "green";
		this.addBoid(p);
	}

	public addSensiblePrey() {
		var position = newVector().randomize(this.radius * Math.random()); // random within radius
		var velocity = newVector().randomize(Prey.SPEED_FACTOR * BASE_SPEED * Math.random()); 
		var genetics = preyGenetics();
		var p = new Prey(position, velocity, genetics);
		p.timeOfLastReproduction = Math.floor(Math.random() * p.reproduction_counter);
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
		var addTo: {[key: string]: _Boid} = b.isPrey ? this.prey : this.predators;
		var id = b.boidID;
		if (addTo[id]) {
			console.error("Duplicate boid with id", id);
		}
		addTo[id] = b;
	}

	public neighbors(b: _Boid, prey: boolean): _Boid[] {
		var mapToSearch = prey ? this.prey : this.predators;
		var isRightType = (id: string) => !!mapToSearch[id];
		var inRange = (x: _Boid) => b.position.distance(x.position, 0) <= NEIGHBOR_RADIUS;
		
		var compareFn = (b1: _Boid, b2: _Boid) => {
			var d1 = b1.position.distance(b.position, this.radius);
			var d2 = b2.position.distance(b.position, this.radius);
			return d1 - d2;
		}
		return this.neighborDetector.neighbors(b.boidID)
					.filter(isRightType)
					.map((id: string) => mapToSearch[id])
					.filter(inRange)
					.sort(compareFn)
					.slice(0, NUM_NEIGHBORS_TO_SHOW);
	}

	public removeBoid(b: _Boid) {
		var removeFrom = b.isPrey ? this.prey : this.predators;
		if (!removeFrom[b.boidID]) {
			console.error("tried to remove non-existent boid", b.boidID);
		}
		delete removeFrom[b.boidID];
		this.neighborDetector.remove(b.boidID);
	}

	private reproduceBoid(mom: _Boid) {
		var potentialParents: _Boid[] = this.neighbors(mom, mom.isPrey);
		var dad: _Boid;
		if (potentialParents.length == 1) {
			dad = mom; // awwwwkward....
		} else {
			var minDistance = Infinity;
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
		child.food = mom.reproduction_threshold / 4;
		mom.food -= mom.reproduction_threshold / 4;
		mom.timeOfLastReproduction = this.nSteps;
		child.timeOfLastReproduction = this.nSteps;
	}

	public step() {
		var allBoids = boidsFromMap(this.prey).concat(boidsFromMap(this.predators));
		allBoids.forEach((b) => {
			this.neighborDetector.add(b.boidID, b.position.x, b.position.y);
		});
		allBoids.forEach((b) => {
			b.accelerate(this);
		});

		allBoids.forEach((b) => {
			b.step(this.radius);
		});

		boidsFromMap(this.prey).forEach((p: Prey) => {
			p.food += this.foodBackground.getFood(p.position, this.nSteps);
		});

		// Every predator will eat any nearby prey
		var eatenThisTurn = {};
		boidsFromMap(this.predators).forEach((d: Predator) => {
			boidsFromMap(this.prey).forEach((y: Prey) => {
				if (eatenThisTurn[y.boidID]) {
					return; // otherwise we would eat the same boid twice
					// nb this is the one time in which the iteration order matters, since 
					// the predator that iterates first gets to win ties over food
				}
				if (d.position.distance(y.position, 0) <= RANGE_TO_CONSUME) {
					d.food+= y.food;
					this.removeBoid(y);
					eatenThisTurn[y.boidID] = true;
				}
			});
		});

		// rebuild the allBoids list since some have died this turn (RIP)
		// handle both death (due to starvation) and birth in this cycle... very circle-of-life-y
		allBoids = boidsFromMap(this.prey).concat(boidsFromMap(this.predators)); 
		allBoids.forEach((b) => {
			b.food -= b.food_burn;
			if (b.food > b.reproduction_threshold && b.timeOfLastReproduction < this.nSteps + b.reproduction_counter) {
				this.reproduceBoid(b);
			} else if (b.food < 0) {
				this.removeBoid(b);
			}
		});

		this.nSteps++;
	}

	public render() {
		this.renderer.renderPrey(boidsFromMap(this.prey));
		this.renderer.renderPredators(boidsFromMap(this.predators));
	}
}

// Utility method to get all of the boids out of a map from IDs to boids
var boidsFromMap = (m: {[key: string]: _Boid}) => Object.keys(m).map((k) => m[k]);
