/// <reference path="renderer.ts" />
/// <reference path="world.ts" />

window.onload = () => {
	var renderer = new Renderer2D("svg");
	var world = new World(800, 800, renderer, 50);
	var go = () => {
		world.render();
		world.step();
	}
	setInterval(go, 16);
}