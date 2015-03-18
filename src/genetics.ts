var MAX_WEIGHT = 100;
var MAX_RADIUS = 50;

var weightMutation = d3.random.normal(0, C.WEIGHT_MUTATION_CONSTANT);
var radiusMutation = d3.random.normal(0, C.RADIUS_MUTATION_CONSTANT);
var colorMutation = d3.random.normal(0, C.COLOR_MUTATION_CONSTANT);

function bound(x, a, b) {
	if (x < a) return a;
	if (x > b) return b;
	return x;
}

function geneticChoice(a, b) {
	var r = Math.random();
	if (r < 0.33) {
		return a;
	} else if (r < 0.66) {
		return b;
	} else {
		return (a+b)/2;
	}
}

class FlockConfig {
	public seperationWeight: number;
	public alignmentWeight: number;
	public cohesionWeight: number;

	public seperationRadius: number;
	constructor(seperationWeight, alignmentWeight, cohesionWeight, seperationRadius) {
		this.seperationWeight = seperationWeight;
		this.seperationRadius = seperationRadius;
		this.alignmentWeight = alignmentWeight;
		this.cohesionWeight = cohesionWeight;
	}

	clone(): FlockConfig {
		return new FlockConfig(this.seperationWeight, this.alignmentWeight, this.cohesionWeight, this.seperationRadius)
	}

	reproduceWith(other: FlockConfig): FlockConfig {
		var seperationWeight = geneticChoice(this.seperationWeight, other.seperationWeight);
		var seperationRadius = geneticChoice(this.seperationRadius, other.seperationRadius);
		var alignmentWeight = geneticChoice(this.alignmentWeight, other.alignmentWeight);
		var cohesionWeight = geneticChoice(this.cohesionWeight, other.cohesionWeight);

		return new FlockConfig(seperationWeight, alignmentWeight, cohesionWeight, seperationRadius);
	}

	mutate(): FlockConfig {
		this.seperationWeight += weightMutation();
		this.alignmentWeight  += weightMutation();
		this.cohesionWeight   += weightMutation();
		this.seperationWeight = bound(this.seperationWeight, -MAX_WEIGHT, MAX_WEIGHT);
		this.alignmentWeight  = bound(this.alignmentWeight, -MAX_WEIGHT, MAX_WEIGHT);
		this.cohesionWeight   = bound(this.cohesionWeight, -MAX_WEIGHT, MAX_WEIGHT);

		this.seperationRadius += radiusMutation();
		this.seperationRadius = bound(this.seperationRadius, 0, MAX_RADIUS);
		return this;
	}
}

class Genetics {
	public preyFlocking: FlockConfig; // how to flock in response to presence of prey
	public predatorFlocking: FlockConfig; // how to flock in response to presence of predators
	public closestFlocking: FlockConfig; // predator only: how to flock in response to single closest prey
	public color: number;

	constructor(preyFlocking, predatorFlocking, closestFlocking, color) {
		this.preyFlocking = preyFlocking;
		this.predatorFlocking = predatorFlocking;
		this.closestFlocking = closestFlocking;
		this.color = color;
	}

	public mutate(): Genetics {
		this.preyFlocking.mutate();
		this.predatorFlocking.mutate();
		this.closestFlocking.mutate();
		this.color = bound(Math.round(this.color + colorMutation()), 0, 255)
		return this;
	}

	public reproduceWith(otherParent: Genetics): Genetics {
		var preyFlocking = this.preyFlocking.reproduceWith(otherParent.preyFlocking);
		var predatorFlocking = this.predatorFlocking.reproduceWith(otherParent.predatorFlocking);
		var closestFlocking = this.closestFlocking.reproduceWith(otherParent.closestFlocking);
		var color = (this.color + otherParent.color) / 2;
		return new Genetics(preyFlocking, predatorFlocking, closestFlocking, color).mutate();
	}
}

function randInt256() {
	return Math.floor(Math.random() * 256);
}

function randomGenetics() {
	return new Genetics(randomFlocking(), randomFlocking(), randomFlocking(), randInt256());
}

function flockingPreyGenetics() {
	var prey = new FlockConfig(1, 1, 1, 10);
	var predator = new FlockConfig(2, -1, -1, 50);
	var closest = new FlockConfig(0, 0, 0, 0);
	return new Genetics(prey, predator, closest, 240);
}

function nonFlockingPreyGenetics() {
	var prey = new FlockConfig(1, 0, 0, 10);
	var predator = new FlockConfig(2, -1, -1, 50);
	var closest = new FlockConfig(0, 0, 0, 0);
	return new Genetics(prey, predator, closest, 180);
}


function predatorGenetics() {
	var prey = new FlockConfig(-3, 1, 1, 500);
	var predator = new FlockConfig(1, 1, 1, 30);
	var closest = new FlockConfig(-6, 2, 2, 50);
	return new Genetics(prey, predator, closest, 0);
}

function randomFlocking() {
	var sW = Math.random() * MAX_WEIGHT * 2 - MAX_WEIGHT;
	var aW = Math.random() * MAX_WEIGHT * 2 - MAX_WEIGHT;
	var cW = Math.random() * MAX_WEIGHT * 2 - MAX_WEIGHT;
	var sR = Math.random() * MAX_RADIUS;
	return new FlockConfig(sW, aW, cW, sR);
}



