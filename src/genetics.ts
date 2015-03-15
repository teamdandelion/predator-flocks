var MAX_WEIGHT = 100;
var MAX_RADIUS = 50;

var WEIGHT_RANDOM_STDDEV = 5;
var RADIUS_RANDOM_STTDEV = 2;
var weightMutation = d3.random.normal(0, WEIGHT_RANDOM_STDDEV);
var radiusMutation = d3.random.normal(0, RADIUS_RANDOM_STTDEV);

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

	constructor(preyFlocking, predatorFlocking) {
		this.preyFlocking = preyFlocking;
		this.predatorFlocking = predatorFlocking;
	}

	public mutate(): Genetics {
		this.preyFlocking.mutate();
		this.predatorFlocking.mutate();
		return this;
	}

	public reproduceWith(otherParent: Genetics): Genetics {
		var preyFlocking = this.preyFlocking.reproduceWith(otherParent.preyFlocking);
		var predatorFlocking = this.predatorFlocking.reproduceWith(otherParent.predatorFlocking);
		return new Genetics(preyFlocking, predatorFlocking).mutate();
	}
}

function randomGenetics() {
	return new Genetics(randomFlocking(), randomFlocking());
}

function randomFlocking() {
	var sW = Math.random() * MAX_WEIGHT * 2 - MAX_WEIGHT;
	var aW = Math.random() * MAX_WEIGHT * 2 - MAX_WEIGHT;
	var cW = Math.random() * MAX_WEIGHT * 2 - MAX_WEIGHT;
	var sR = Math.random() * MAX_RADIUS;
	return new FlockConfig(sW, aW, cW, sR);
}



