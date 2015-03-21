
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
	distance(v: Vector): number;
	normSq(): number;
	norm(): number;
	// normalize: set vector to have a given norm (length). defaults to 1
	normalize(norm?: number): Vector;
	// set vector to random values, with given norm (defualts to 1)
	randomize(norm?: number): Vector; 
	// wrap(radius: number): Vector;
}

function newVector(): Vector {
	if (C.COORDINATES_3D) {
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

	distance(v: Vector2): number {
		return Math.sqrt(Math.pow(v.x-this.x, 2) + Math.pow(v.y-this.y, 2));			
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

	// wrap(radius: number): Vector2 {
	// 	var zero = new Vector2();
	// 	var dist = zero.distance(this, 0);
	// 	if (dist <= radius) return this; // shortcut out, since we will be adding a zero vector
	// 	var vectorOnEdgeOfCircle = this.clone().limit(radius).mult(-2); // vector on opposite edge of circle
	// 	this.add(vectorOnEdgeOfCircle);
	// 	return this.wrap(radius);
	// }
}


