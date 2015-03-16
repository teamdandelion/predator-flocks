
interface Vector {
	// NB These vectors are all mutable, I trust myself to keep track of when they 
	// are safe to mutate in this small project, but if I were making this part of
	// a bigger codebase I would consider having the default methods return copies, and
	// leave clearly-labeled-as-unsafe mutable vectors for use on the critical path
	x: number;
	y: number;
	z: number;
	clone(): Vector;
	add(v: Vector): Vector;
	subtract(v: Vector): Vector;
	mult(scalar: number): Vector;
	divide(scalar: number): Vector;
	limit(magnitude: number): Vector;
	distance(v: Vector, radius: number): number;
	normSq(): number;
	norm(): number;
	// normalize: set vector to have a given norm (length). defaults to 1
	normalize(norm?: number): Vector;
	// set vector to random values, with given norm (defualts to 1)
	randomize(norm?: number): Vector; 
	wrap(radius: number): Vector;
}

function newVector(): Vector {
	if (COORDINATES_3D) {
		console.error("not implemented") //return new Vector3
	} else {
		return new Vector2();
	}
}

class Vector2 implements Vector {
	public z = 0;
	// All of the vector methods, except clone, mutate the vector.
	constructor(public x=0, public y=0) {}

	clone(): Vector2 {
		return new Vector2(this.x, this.y);
	}

	add(v: Vector2): Vector2 {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	subtract(v: Vector2): Vector2 {
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}

	mult(scalar: number): Vector2 {
		this.x *= scalar;
		this.y *= scalar;
		return this;
	}

	divide(scalar: number): Vector2 {
		this.x /= scalar;
		this.y /= scalar;
		return this;
	}

	// 'Locally euclidian' distance on a disk that wraps into a sphere :P
	distance(v: Vector2, radius: number): number {
		if (radius == 0 || true) {
			return Math.sqrt(Math.pow(v.x-this.x, 2) + Math.pow(v.y-this.y, 2));			
		} else {
			var targetWrappedWrtThisVector = v.clone().subtract(this).wrap(radius);
			var dx = targetWrappedWrtThisVector.x;
			var dy = targetWrappedWrtThisVector.y;
			return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
		}
	}

	limit(magnitude: number): Vector2 {
		var n = this.norm();
		if (n > magnitude) {
			this.mult(magnitude / n);
		}
		return this;
	}

	normSq(): number{
		return Math.pow(this.x, 2) + Math.pow(this.y, 2);
	}

	norm(): number {
		return Math.sqrt(this.normSq());
	}

	normalize(norm = 1): Vector2 {
		this.mult(norm/this.norm());
		return this;
	}

	randomize(norm = 1): Vector2 {
		this.x = Math.random() - .5;
		this.y = Math.random() - .5;
		this.normalize(norm);
		return this;
	}

	wrap(radius: number): Vector2 {
		var zero = new Vector2();
		var dist = zero.distance(this, 0);
		if (dist <= radius) return this; // shortcut out, since we will be adding a zero vector
		var vectorOnEdgeOfCircle = this.clone().limit(radius).mult(-2); // vector on opposite edge of circle
		this.add(vectorOnEdgeOfCircle);
		return this.wrap(radius);
	}
}

// if this were a more serious project i would set up a unit testing framework, 
// but for now i'll just inline tests here and call them from console
var assert = (expected, actual, message) => {
	if (expected != actual) {
		console.error(message, "Expected ", expected, "but got", actual);
	}
}

var assertClose = (expected, actual, message, margin=0.1) => {
	if (actual < expected - 0.1 || actual > expected + 0.1) {
		console.error(message, "Expected ", expected, "to be close to", actual);
	}
}

var testVector = () => {
	var v = new Vector2(0, 1.1);
	assertClose(-.9, v.wrap(1), "1.1 wraps to -.9 on radius 1");
	var vWrap = new Vector2(0, 2);
	assert(2, vWrap.wrap(2).y, "2 wraps over 2 to 2");
	assert(0, vWrap.wrap(1).y, "2 wraps over 1 to 0");

	var v0 = new Vector2();
	var v1 = new Vector2(0, 1);
	var v2 = new Vector2(0, -1);
	assert(0, v1.distance(v2, 1), "wrap 1 to -1");
}




