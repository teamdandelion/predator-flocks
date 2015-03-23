var NUM_NEIGHBORS_TO_SHOW = 7;
var RANGE_TO_CONSUME = 5;

class World {
	private predators: {[key: string]: Predator} ; // ids of the predators
	private prey: {[key: string]: Prey};
	private foodBackground: FoodBackground;
	private neighborDetector: GridNeighborDetector;
	public nSteps = 0;

	constructor(public width: number, public height: number, private renderer: Renderer2D) {
		var standardFlocking = {seperationWeight: 1, alignmentWeight: 1, cohesionWeight: 1};
		var standardGenetics = {preyFlocking: standardFlocking, predatorFlocking: standardFlocking, targetFlocking: standardFlocking};
		this.predators = {};
		this.prey = {};
		this.neighborDetector = new GridNeighborDetector(this.width, this.height, C.NEIGHBOR_RADIUS);
		this.foodBackground = new FoodBackground()
	}

	public randomSpot(): Vector {
		var x = Math.random() * this.width;
		var y = Math.random() * this.height;
		return new Vector2(x, y);
	}

	public addPrey(g: Genetics, position?: Vector, velocity?: Vector) {
		position = position ? position : this.randomSpot(); // random within radius
		velocity = velocity ? velocity : newVector().randomize(Prey.SPEED_FACTOR * C.BASE_SPEED); 
		var p = new Prey(position, velocity, g);
		this.addBoid(p);
	}

	public addPredator(g: Genetics) {
		var position = this.randomSpot(); // random within radius
		var velocity = newVector().randomize(Prey.SPEED_FACTOR * C.BASE_SPEED); 
		var p = new Predator(position, velocity, g);
		this.addBoid(p);
	}

	public addBoid(b: Boid) {
		var addTo: {[key: string]: Boid} = b.isPrey ? this.prey : this.predators;
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

	public neighbors(b: Boid, prey: boolean): Boid[] {
		var mapToSearch = prey ? this.prey : this.predators;
		var isRightType = (id: string) => !!mapToSearch[id];
		var inRange = (x: Boid) => b.position.distance(x.position) <= C.NEIGHBOR_RADIUS;
		
		var compareFn = (b1: Boid, b2: Boid) => {
			var d1 = b1.position.distance(b.position);
			var d2 = b2.position.distance(b.position);
			return d1 - d2;
		}

		var neighborsToCheck: Boid[];
		if (b.isPrey) {
			neighborsToCheck = this.neighborDetector.neighbors(b.boidID)
									.filter(isRightType)
									.map((id: string) => mapToSearch[id])
									.filter(inRange);
		} else {
			neighborsToCheck = boidsFromMap(mapToSearch)
		}
		return neighborsToCheck
					.sort(compareFn)
					.slice(0, NUM_NEIGHBORS_TO_SHOW);
	}

	public removeBoid(b: Boid) {
		var removeFrom = b.isPrey ? this.prey : this.predators;
		if (!removeFrom[b.boidID]) {
			console.error("tried to remove non-existent boid", b.boidID);
		}
		delete removeFrom[b.boidID];
		this.neighborDetector.remove(b.boidID);
		if (!b.isPrey) {
			this.renderer.addCorpseToRender(b);
		}

	}

	private reproduceBoid(mom: Boid) {
		var potentialParents: Boid[] = this.neighbors(mom, mom.isPrey);
		var dad: Boid;
		if (potentialParents.length == 1) {
			dad = mom; // awwwwkward....
		} else {
			var minDistance = Infinity;
			potentialParents.forEach((p: Boid) => {
				var dist = p.position.distance(mom.position);
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
		mom.stepsSinceLastReproduction = 0;
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
			b.step(this.width, this.height);
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
				if (d.position.distance(y.position) <= RANGE_TO_CONSUME) {
					d.gainFood(C.PREDATOR_FOOD_PER_PREY);
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
			if (b.canReproduce() && (nBoids < C.MAXBoidS || !b.isPrey)) {
				// if we have hit max boids, we still allow predators to reproduce
				this.reproduceBoid(b);
				nBoids++;
			} else if (b.food < 0) {
				if (!b.isPrey && nPredators <= C.MIN_NUM_PREDATORS && nPrey > 0) {
				// if there's just MIN_PREDATORS predator, let's allow it to survive unless there's an extinction event
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
		this.renderer.renderCorpses();
	}
}

// Utility method to get all of the boids out of a map from IDs to boids
var boidsFromMap = (m: {[key: string]: Boid}) => Object.keys(m).map((k) => m[k]);
