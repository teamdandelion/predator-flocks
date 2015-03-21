/// <reference path="world.ts" />
/// <reference path="vector.ts" />

var world: World;
window.onload = () => {
	var w = window.innerWidth;
	var h = window.innerHeight;
	var renderer = new Renderer2D(w, h, "#outer");
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
	document.getElementById("addPredator").onclick = addPredator
	document.getElementById("addFlocking").onclick = addFlockingPrey
	document.getElementById("addNonFlocking").onclick = addNonFlockingPrey
	document.getElementById("killAll").onclick = killAllBoids
}

function addPredator() {
	world.addPredator(predatorGenetics());
}

function addFlockingPrey() {
	world.addPrey(flockingPreyGenetics());
}

function addNonFlockingPrey() {
	world.addPrey(nonFlockingPreyGenetics());
}

function killAllBoids() {
	world.killAllBoids();
}