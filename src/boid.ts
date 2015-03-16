var BASE_SPEED = 1;
var COORDINATES_3D = false; // false -> 2d, true -> 3d
var NEIGHBOR_RADIUS = 50;


class _Boid {
	public static SPEED_FACTOR: number;
	protected static IS_PREY: boolean;
	private static ID_INCREMENTER = 0;
	public radius: number;

	public position: Vector;
	public velocity: Vector;
	private maxSpeed: number;
	public isPrey: boolean;
	public genetics: Genetics;
	public boidID: string;
	public age = 0;
	public food_burn: number;
	public reproduction_threshold: number;
	public reproduction_counter: number;
	public food: number;
	public maxForce: number;
	public timeOfLastReproduction = 0;

	constructor(initialPosition: Vector, initialVelocity: Vector, genetics: Genetics) {
		// cute hack to get seperate default for Prey or Predator depending on which constructor was invoked.
		this.maxSpeed = (<typeof _Boid> this.constructor).SPEED_FACTOR * BASE_SPEED; 
		this.isPrey = (<typeof _Boid> this.constructor).IS_PREY; 
		this.position = initialPosition.clone();
		this.velocity = initialVelocity.clone().limit(this.maxSpeed);
		this.genetics = genetics;
		this.boidID = (_Boid.ID_INCREMENTER++).toString();
	}

	public step(worldRadius: number) {
		var distToEdge = worldRadius - this.position.norm();
		if (distToEdge < 20) {
			var vectorIn = this.position.clone().mult(-1).normalize(this.maxForce * 100 / distToEdge / distToEdge);
			this.velocity.add(vectorIn);
		}
		this.position.add(this.velocity).wrap(worldRadius);
		this.age++;

	}

	private computeAcceleration(world) {
		var prey = world.neighbors(this, true);
		var flockPrey = this.flock(prey, this.genetics.preyFlocking, world.radius);
		var predators = world.neighbors(this, false);
		var flockPredators = this.flock(predators, this.genetics.predatorFlocking, world.radius);


		if (!this.isPrey) {
			// predators can get stuck in a sad "buridan's donkey" esque situation where they are
			// unable to decide when in the midst of a lot of prey.
			// this setting allows them to chase the closest one
			var closestPrey = prey.slice(0, 1);
			var flockClosest = this.flock(closestPrey, this.genetics.closestFlocking, world.radius);
			flockPrey.add(flockClosest);
		}

		return flockPrey.add(flockPredators);
	}

	public accelerate(world) {
		var a = this.computeAcceleration(world)
		this.velocity.add(a).limit(this.maxSpeed);
	}

	private seperate(neighbors: _Boid[], seperationRadius: number, worldRadius: number) {
		// This code is based on implementation by Harry Bundage found at http://harry.me/blog/2011/02/17/neat-algorithms-flocking/
		var seperationVector = newVector();
		var count = 0;
		var zeroDetected = false;
		neighbors.forEach((n) => {
			var d = this.position.distance(n.position, worldRadius);
			if (0 < d && d < seperationRadius) {
				var vectorAway = this.position.clone().subtract(n.position);
				vectorAway.normalize().divide(d);
				seperationVector.add(vectorAway);
				count++;
			}
			zeroDetected = zeroDetected || d == 0;
		});
		if (count > 0) {
			seperationVector.divide(count);
		} else if (zeroDetected) {
			// every neighbor was at zero distance, so let's choose randomly where to go
			seperationVector.randomize(this.maxForce);
		}
		return seperationVector;

	}

	private align(neighbors: _Boid[], worldRadius: number) {
		// This code is based on implementation by Harry Bundage found at http://harry.me/blog/2011/02/17/neat-algorithms-flocking/
		var averageVelocity = newVector();
		var count = 0;
		neighbors.forEach((n) => {
			var d = this.position.distance(n.position, worldRadius);
			if (0 < d && d < NEIGHBOR_RADIUS) {
				averageVelocity.add(n.velocity);
				count++;
			}
		});
		if (count > 0) {
			averageVelocity.mult(1/count);
		}
		averageVelocity.limit(this.maxForce);
		return averageVelocity;
	}

	private cohere(neighbors: _Boid[], worldRadius: number){
		// This code is based on implementation by Harry Bundage found at http://harry.me/blog/2011/02/17/neat-algorithms-flocking/
		var averagePosition = newVector();
		var count = 0;
		neighbors.forEach((n) => {
			var d = this.position.distance(n.position, worldRadius);
			if (0 < d && d < NEIGHBOR_RADIUS) {
				averagePosition.add(n.position);
				count++;
			}
		});
		if (count > 0) {
			return this.steer_to(averagePosition.divide(count));
		} else {
			return averagePosition;
		}
	}

	private steer_to(target: Vector): Vector {
		// This code is based on implementation by Harry Bundage found at http://harry.me/blog/2011/02/17/neat-algorithms-flocking/
		var desired = target.subtract(this.position);
		var d = desired.norm();
		var steer: Vector;
		if (d > 0) {
			desired.normalize();
			// add damping
			if (d < 100) {
				desired.mult(this.maxSpeed * d / 100)
			} else {
				desired.mult(this.maxSpeed);
			}
			steer = desired.subtract(this.velocity);
			steer.limit(this.maxForce);
		} else {
			steer = newVector();
		}
		return steer;
	}

	private flock(neighbors: _Boid[], config: FlockConfig, worldRadius: number): Vector {
		// This code is based on implementation by Harry Bundage found at http://harry.me/blog/2011/02/17/neat-algorithms-flocking/
		var s = this.seperate(neighbors, config.seperationRadius, worldRadius).mult(config.seperationWeight);
		var a = this.align(neighbors, worldRadius).mult(config.alignmentWeight);
		var c = this.cohere(neighbors, worldRadius).mult(config.cohesionWeight);
		return s.add(a).add(c);
	}
}

class Prey extends _Boid {
	public static SPEED_FACTOR = 1;
	protected static IS_PREY = true;
	public radius = 2;
	public food_burn = 0.2;
	public reproduction_threshold = 250;
	public food = 50;
	public maxForce = 0.03;
	public reproduction_counter = 200;
}

class Predator extends _Boid {
	public static SPEED_FACTOR = 1.3;
	protected static IS_PREY = false;

	public radius = 5;
	public food_burn = 0.8;
	public reproduction_threshold = 1500;
	public food = 600;
	public maxForce = 0.03;
	public reproduction_counter = 600;
}

