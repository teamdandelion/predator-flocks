/// <reference path="world.ts" />
/// <reference path="vector.ts" />

module PF {
	export function generateWorld(div: Element) {
		var world: World;
		var w = div.innerWidth;
		var h = div.innerHeight;
		var renderer = new Renderer2D(w, h, div);
		world = new World(w, h, renderer);
		for (var i=0; i<5; i++) {
			var flockPosition = newVector().randomize(400 * 0.5);
			for (var j=0; j<10; j++) {
				world.addPrey(flockingPreyGenetics(), world.randomSpot(), newVector());
			}
		}

		var nonFlockPosition = newVector().randomize(400 * 0.5);
		for (var i=0; i<0; i++) {
			world.addPrey(nonFlockingPreyGenetics(), world.randomSpot(), newVector());
		}

		for (var i=0; i<5; i++) {
			world.addPredator(predatorGenetics());
		}
		var go = () => {
			world.render();
			world.step();
		}
		setInterval(go, 16);
	}

var mouseBoid = null;

export function mouseClick(e) {
	if (mouseBoid != null && !mouseBoid.isAlive) {
		mouseBoid = null;
		document.body.style.cursor = "auto";
	}
	var p = new Vector2(e.clientX, e.clientY);
	if (mouseBoid != null) {
		world.removeBoid(mouseBoid);
	}
	if (mouseBoid == null) {
		mouseBoid = new MousePrey(p, flockingPreyGenetics())
		document.body.style.cursor = "none";
	} else if (mouseBoid.isPrey) {
		mouseBoid = new MousePredator(p, predatorGenetics());
		document.body.style.cursor = "none";
	} else {
		mouseBoid = null;
		document.body.style.cursor = "auto";
	}
	if (mouseBoid != null) {
		world.addBoid(mouseBoid);
	}
}

	export function mouseMove(e) {
		if (mouseBoid != null && !mouseBoid.isAlive) {
			mouseBoid = null;
			document.body.style.cursor = "auto";
		}
		console.log("move")
		if (mouseBoid != null) {
			var pos = new Vector2(e.clientX, e.clientY);
			var vel = pos.clone().subtract(mouseBoid.position);
			mouseBoid.position = pos;
			mouseBoid.vel = vel;
		}
	}

	export function addPredator(world) {
		world.addPredator(predatorGenetics());
	}

	export function addFlockingPrey(world) {
		world.addPrey(flockingPreyGenetics());
	}

	export function addNonFlockingPrey(world) {
		world.addPrey(nonFlockingPreyGenetics());
	}

	export function killAllBoids(world) {
		world.killAllBoids();
	}
}
