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
		this.neighborDetector = new GridNeighborDetector(this.radius*2, this.radius*2, C.NEIGHBOR_RADIUS);
		this.foodBackground = new FoodBackground(this.radius)
	}


	public addPrey(g: Genetics, position?: Vector, velocity?: Vector) {
		position = position ? position : newVector().randomize(this.radius * Math.random()); // random within radius
		velocity = velocity ? velocity : newVector().randomize(Prey.SPEED_FACTOR * C.BASE_SPEED); 
		var p = new Prey(position, velocity, g);
		this.addBoid(p);
	}

	public addPredator(g: Genetics) {
		var position = newVector().randomize(this.radius * Math.random()); // random within radius
		var velocity = newVector().randomize(Prey.SPEED_FACTOR * C.BASE_SPEED); 
		var p = new Predator(position, velocity, g);
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

	public killAllBoids() {
		var allBoids = boidsFromMap(this.prey).concat(boidsFromMap(this.predators));
		allBoids.forEach((b) => this.removeBoid(b));
	}

	public neighbors(b: _Boid, prey: boolean): _Boid[] {
		var mapToSearch = prey ? this.prey : this.predators;
		var isRightType = (id: string) => !!mapToSearch[id];
		var inRange = (x: _Boid) => b.position.distance(x.position, 0) <= C.NEIGHBOR_RADIUS;
		
		var compareFn = (b1: _Boid, b2: _Boid) => {
			var d1 = b1.position.distance(b.position, this.radius);
			var d2 = b2.position.distance(b.position, this.radius);
			return d1 - d2;
		}

		var neighborsToCheck: _Boid[];
		if (b.isPrey) {
			neighborsToCheck = this.neighborDetector.neighbors(b.boidID)
									.filter(isRightType)
									.map((id: string) => mapToSearch[id])
									.filter(inRange);
		} else {
			neighborsToCheck = boidsFromMap(this.prey)
		}
		return neighborsToCheck
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
		child.food = mom.energyRequiredForReproduction / 4;
		mom.food -= mom.energyRequiredForReproduction / 2;
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
			p.gainFood(this.foodBackground.getFood(p.position, this.nSteps));
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
					d.gainFood(y.food);
					this.removeBoid(y);
					eatenThisTurn[y.boidID] = true;
					d.busyEating = C.CONSUMPTION_TIME;
				}
			});
		});

		// rebuild the allBoids list since some have died this turn (RIP)
		// handle both death (due to starvation) and birth in this cycle... very circle-of-life-y
		var nPredators = Object.keys(this.predators).length;
		var nPrey = Object.keys(this.prey).length;
		var nBoids = nPredators + nPrey;
		allBoids = boidsFromMap(this.prey).concat(boidsFromMap(this.predators)); 
		allBoids.forEach((b) => {
			b.food -= b.foodEatenPerStep;
			if (b.food > b.energyRequiredForReproduction 
				&& b.timeOfLastReproduction < this.nSteps + b.turnsToReproduce
				&& (nBoids < C.MAX_BOIDS || !b.isPrey)) {
				this.reproduceBoid(b);
				nBoids++;
			} else if (b.food < 0) {
				if (!b.isPrey && nPredators <=3 && nPrey > 0) {
				// if there's just one predator, let's allow it to survive unless there's an extinction event
					b.food = 0;
					b.age = 0;
				} else {
					this.removeBoid(b);
				}
			}
		});

		this.nSteps++;
	}

	public render() {
		this.renderer.renderBoids(boidsFromMap(this.prey), true);
		this.renderer.renderBoids(boidsFromMap(this.predators), false);
		this.renderer.renderBackground(this.foodBackground);
	}
}

// Utility method to get all of the boids out of a map from IDs to boids
var boidsFromMap = (m: {[key: string]: _Boid}) => Object.keys(m).map((k) => m[k]);
