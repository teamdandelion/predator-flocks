/// <reference path="renderer.ts" />
/// <reference path="world.ts" />
/// <reference path="vector.ts" />

window.onload = () => {
	var renderer = new Renderer2D(400, "svg");
	var world = new World(400, renderer);
	for (var i=0; i<20; i++) {
		world.addRandomPrey();
	}

	for (var i=0; i<100; i++) {
		world.addSensiblePrey();
	}

	for (var i=0; i<3; i++) {
		world.addRandomPredator();
	}
	var go = () => {
		world.render();
		world.step();
	}
	setInterval(go, 16);
	testVector();
}
