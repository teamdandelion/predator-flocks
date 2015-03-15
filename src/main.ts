/// <reference path="renderer.ts" />
/// <reference path="world.ts" />

window.onload = () => {
	var renderer = new Renderer2D(400, "svg");
	var world = new World(400, renderer);
	for (var i=0; i<100; i++) {
		world.addRandomPrey()
	}
	var go = () => {
		world.render();
		world.step();
	}
	setInterval(go, 16);
}