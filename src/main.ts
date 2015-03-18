/// <reference path="renderer.ts" />
/// <reference path="world.ts" />
/// <reference path="vector.ts" />

var world: World;
window.onload = () => {
	var renderer = new Renderer2D(400, "#outer");
	world = new World(400, renderer);
	var flockPosition = newVector().randomize(400 * 0.5);
	for (var i=0; i<100; i++) {
		world.addPrey(flockingPreyGenetics(), newVector().randomize(20).add(flockPosition), newVector());
	}

	var nonFlockPosition = newVector().randomize(400 * 0.5);
	for (var i=0; i<10; i++) {
		world.addPrey(nonFlockingPreyGenetics(), newVector().randomize(20).add(nonFlockPosition), newVector());
	}

	for (var i=0; i<10; i++) {
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