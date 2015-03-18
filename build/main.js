var C;
(function (C) {
    C.NEIGHBOR_RADIUS = 50;
    C.BASE_SPEED = 1;
    C.PREY_RADIUS = 2;
    C.PREY_MAX_FORCE = 0.03;
    C.PREY_SPEED_FACTOR = 1;
    C.PREDATOR_RADIUS = 5;
    C.PREDATOR_MAX_FORCE = 0.03;
    C.PREDATOR_SPEED_FACTOR = 1.15;
    C.PREY_STARTING_FOOD = 300;
    C.PREY_FOOD_PER_STEP = 0.53;
    C.PREY_ENERGY_FOR_REPRODUCTION = 300;
    C.PREY_TURNS_TO_REPRODUCE = 500;
    C.PREY_AGE_FACTOR = 0.97;
    C.PREDATOR_STARTING_FOOD = 1200;
    C.PREDATOR_FOOD_PER_STEP = 2;
    C.PREDATOR_FOOD_PER_PREY = 400;
    C.PREDATOR_KILLS_FOR_REPRODUCTION = 7;
    C.PREDATOR_TURNS_TO_REPRODUCE = 1000;
    C.PREDATOR_AGE_FACTOR = 0.995;
    C.PREDATOR_ENERGY_FOR_REPRODUCTION = C.PREDATOR_FOOD_PER_PREY * C.PREDATOR_KILLS_FOR_REPRODUCTION;
    C.FOOD_STARTING_LEVEL = 0.3;
    C.FOOD_STEPS_TO_REGEN = 8000;
    C.MAX_BOIDS = 100;
    C.COORDINATES_3D = false;
    C.WEIGHT_MUTATION_CONSTANT = 0.2;
    C.RADIUS_MUTATION_CONSTANT = 0.5;
    C.COLOR_MUTATION_CONSTANT = 5;
    C.CONSUMPTION_TIME = 30;
    C.MIN_NUM_PREDATORS = 0;
})(C || (C = {}));
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var _Boid = (function () {
    function _Boid(initialPosition, initialVelocity, genetics) {
        this.age = 0;
        this.stepsSinceLastReproduction = 0;
        this.isPrey = this.constructor.IS_PREY;
        this.position = initialPosition.clone();
        this.velocity = initialVelocity.clone().limit(this.maxSpeed());
        this.genetics = genetics;
        this.boidID = (_Boid.ID_INCREMENTER++).toString();
    }
    _Boid.prototype.canReproduce = function () {
        this.stepsSinceLastReproduction++;
        return this.stepsSinceLastReproduction > this.turnsToReproduce && this.food > this.energyRequiredForReproduction;
    };
    _Boid.prototype.step = function (worldRadius) {
        var distToEdge = worldRadius - this.position.norm();
        if (distToEdge < 20) {
            var vectorIn = this.position.clone().mult(-1).normalize(this.maxForce * 100 / distToEdge / distToEdge);
            this.velocity.add(vectorIn);
        }
        this.position.add(this.velocity).wrap(worldRadius);
        this.age++;
    };
    _Boid.prototype.maxSpeed = function () {
        return this.constructor.SPEED_FACTOR * C.BASE_SPEED * Math.pow(this.ageFactor, Math.round(this.age / 60));
    };
    _Boid.prototype.gainFood = function (f) {
        this.food += f;
        if (this.food > this.energyRequiredForReproduction * 1.5) {
            this.food = this.energyRequiredForReproduction;
        }
    };
    _Boid.prototype.computeAcceleration = function (world) {
        var prey = world.neighbors(this, true);
        var flockPrey = this.flock(prey, this.genetics.preyFlocking, world.radius);
        var predators = world.neighbors(this, false);
        var flockPredators = this.flock(predators, this.genetics.predatorFlocking, world.radius);
        if (!this.isPrey) {
            var closestPrey = prey.slice(0, 1);
            var flockClosest = this.flock(closestPrey, this.genetics.closestFlocking, world.radius);
            flockPrey.add(flockClosest);
        }
        return flockPrey.add(flockPredators);
    };
    _Boid.prototype.accelerate = function (world) {
        var a = this.computeAcceleration(world);
        this.velocity.add(a).limit(this.maxSpeed());
    };
    _Boid.prototype.seperate = function (neighbors, seperationRadius, worldRadius) {
        var _this = this;
        var seperationVector = newVector();
        var count = 0;
        var zeroDetected = false;
        neighbors.forEach(function (n) {
            var d = _this.position.distance(n.position, worldRadius);
            if (0 < d && d < seperationRadius) {
                var vectorAway = _this.position.clone().subtract(n.position);
                vectorAway.normalize().divide(d);
                seperationVector.add(vectorAway);
                count++;
            }
            zeroDetected = zeroDetected || d == 0;
        });
        if (count > 0) {
            seperationVector.divide(count);
        }
        else if (zeroDetected) {
            seperationVector.randomize(this.maxForce);
        }
        return seperationVector;
    };
    _Boid.prototype.align = function (neighbors, worldRadius) {
        var _this = this;
        var averageVelocity = newVector();
        var count = 0;
        neighbors.forEach(function (n) {
            var d = _this.position.distance(n.position, worldRadius);
            if (0 < d && d < C.NEIGHBOR_RADIUS) {
                averageVelocity.add(n.velocity);
                count++;
            }
        });
        if (count > 0) {
            averageVelocity.mult(1 / count);
        }
        averageVelocity.limit(this.maxForce);
        return averageVelocity;
    };
    _Boid.prototype.cohere = function (neighbors, worldRadius) {
        var _this = this;
        var averagePosition = newVector();
        var count = 0;
        neighbors.forEach(function (n) {
            var d = _this.position.distance(n.position, worldRadius);
            if (0 < d && d < C.NEIGHBOR_RADIUS) {
                averagePosition.add(n.position);
                count++;
            }
        });
        if (count > 0) {
            return this.steer_to(averagePosition.divide(count));
        }
        else {
            return averagePosition;
        }
    };
    _Boid.prototype.steer_to = function (target) {
        var desired = target.subtract(this.position);
        var d = desired.norm();
        var steer;
        if (d > 0) {
            desired.normalize();
            if (d < 100) {
                desired.mult(this.maxSpeed() * d / 100);
            }
            else {
                desired.mult(this.maxSpeed());
            }
            steer = desired.subtract(this.velocity);
            steer.limit(this.maxForce);
        }
        else {
            steer = newVector();
        }
        return steer;
    };
    _Boid.prototype.flock = function (neighbors, config, worldRadius) {
        var s = this.seperate(neighbors, config.seperationRadius, worldRadius).mult(config.seperationWeight);
        var a = this.align(neighbors, worldRadius).mult(config.alignmentWeight);
        var c = this.cohere(neighbors, worldRadius).mult(config.cohesionWeight);
        return s.add(a).add(c);
    };
    _Boid.ID_INCREMENTER = 0;
    return _Boid;
})();
var Prey = (function (_super) {
    __extends(Prey, _super);
    function Prey() {
        _super.apply(this, arguments);
        this.radius = C.PREY_RADIUS;
        this.maxForce = C.PREY_MAX_FORCE;
        this.foodEatenPerStep = C.PREY_FOOD_PER_STEP;
        this.energyRequiredForReproduction = C.PREY_ENERGY_FOR_REPRODUCTION;
        this.food = C.PREY_STARTING_FOOD;
        this.turnsToReproduce = C.PREY_TURNS_TO_REPRODUCE;
        this.ageFactor = C.PREY_AGE_FACTOR;
    }
    Prey.SPEED_FACTOR = C.PREY_SPEED_FACTOR;
    Prey.IS_PREY = true;
    return Prey;
})(_Boid);
var Predator = (function (_super) {
    __extends(Predator, _super);
    function Predator() {
        _super.apply(this, arguments);
        this.radius = C.PREDATOR_RADIUS;
        this.maxForce = C.PREDATOR_MAX_FORCE;
        this.foodEatenPerStep = C.PREDATOR_FOOD_PER_STEP;
        this.energyRequiredForReproduction = C.PREDATOR_ENERGY_FOR_REPRODUCTION;
        this.food = C.PREDATOR_STARTING_FOOD;
        this.turnsToReproduce = C.PREDATOR_TURNS_TO_REPRODUCE;
        this.ageFactor = C.PREDATOR_AGE_FACTOR;
        this.busyEating = 0;
    }
    Predator.prototype.accelerate = function (world) {
        if (this.busyEating > 0) {
            this.busyEating--;
            this.velocity.mult(0);
        }
        else {
            _super.prototype.accelerate.call(this, world);
        }
    };
    Predator.SPEED_FACTOR = C.PREDATOR_SPEED_FACTOR;
    Predator.IS_PREY = false;
    return Predator;
})(_Boid);
var FoodBackground = (function () {
    function FoodBackground(radius) {
        this.radius = radius;
        this.stepsToRegen = 5000;
        this.xy2LastAccessTime = d3.map();
        this._eatenThisTurn = [];
    }
    FoodBackground.prototype.eatenThisTurn = function () {
        var copy = this._eatenThisTurn;
        this._eatenThisTurn = [];
        return copy;
    };
    FoodBackground.prototype.getFoodAtTile = function (step, x, y) {
        var s = x.toString() + "," + y.toString();
        var lastAccessTime;
        if (!this.xy2LastAccessTime.has(s)) {
            lastAccessTime = Math.round(-C.FOOD_STARTING_LEVEL * C.FOOD_STEPS_TO_REGEN);
        }
        else {
            lastAccessTime = this.xy2LastAccessTime.get(s);
        }
        var food = (step - lastAccessTime) / C.FOOD_STEPS_TO_REGEN;
        food = Math.min(food, 1);
        this.xy2LastAccessTime.set(s, step);
        this._eatenThisTurn.push([x, y]);
        return food;
    };
    FoodBackground.prototype.getFood = function (position, step) {
        var x = Math.round(position.x);
        var y = Math.round(position.y);
        var food = 0;
        food += this.getFoodAtTile(step, x, y);
        return food * 4;
    };
    return FoodBackground;
})();
var MAX_WEIGHT = 100;
var MAX_RADIUS = 50;
var weightMutation = d3.random.normal(0, C.WEIGHT_MUTATION_CONSTANT);
var radiusMutation = d3.random.normal(0, C.RADIUS_MUTATION_CONSTANT);
var colorMutation = d3.random.normal(0, C.COLOR_MUTATION_CONSTANT);
function bound(x, a, b) {
    if (x < a)
        return a;
    if (x > b)
        return b;
    return x;
}
function geneticChoice(a, b) {
    var r = Math.random();
    if (r < 0.33) {
        return a;
    }
    else if (r < 0.66) {
        return b;
    }
    else {
        return (a + b) / 2;
    }
}
var FlockConfig = (function () {
    function FlockConfig(seperationWeight, alignmentWeight, cohesionWeight, seperationRadius) {
        this.seperationWeight = seperationWeight;
        this.seperationRadius = seperationRadius;
        this.alignmentWeight = alignmentWeight;
        this.cohesionWeight = cohesionWeight;
    }
    FlockConfig.prototype.clone = function () {
        return new FlockConfig(this.seperationWeight, this.alignmentWeight, this.cohesionWeight, this.seperationRadius);
    };
    FlockConfig.prototype.reproduceWith = function (other) {
        var seperationWeight = geneticChoice(this.seperationWeight, other.seperationWeight);
        var seperationRadius = geneticChoice(this.seperationRadius, other.seperationRadius);
        var alignmentWeight = geneticChoice(this.alignmentWeight, other.alignmentWeight);
        var cohesionWeight = geneticChoice(this.cohesionWeight, other.cohesionWeight);
        return new FlockConfig(seperationWeight, alignmentWeight, cohesionWeight, seperationRadius);
    };
    FlockConfig.prototype.mutate = function () {
        this.seperationWeight += weightMutation();
        this.alignmentWeight += weightMutation();
        this.cohesionWeight += weightMutation();
        this.seperationWeight = bound(this.seperationWeight, -MAX_WEIGHT, MAX_WEIGHT);
        this.alignmentWeight = bound(this.alignmentWeight, -MAX_WEIGHT, MAX_WEIGHT);
        this.cohesionWeight = bound(this.cohesionWeight, -MAX_WEIGHT, MAX_WEIGHT);
        this.seperationRadius += radiusMutation();
        this.seperationRadius = bound(this.seperationRadius, 0, MAX_RADIUS);
        return this;
    };
    return FlockConfig;
})();
var Genetics = (function () {
    function Genetics(preyFlocking, predatorFlocking, closestFlocking, color) {
        this.preyFlocking = preyFlocking;
        this.predatorFlocking = predatorFlocking;
        this.closestFlocking = closestFlocking;
        this.color = color;
    }
    Genetics.prototype.mutate = function () {
        this.preyFlocking.mutate();
        this.predatorFlocking.mutate();
        this.closestFlocking.mutate();
        this.color = bound(Math.round(this.color + colorMutation()), 0, 255);
        return this;
    };
    Genetics.prototype.reproduceWith = function (otherParent) {
        var preyFlocking = this.preyFlocking.reproduceWith(otherParent.preyFlocking);
        var predatorFlocking = this.predatorFlocking.reproduceWith(otherParent.predatorFlocking);
        var closestFlocking = this.closestFlocking.reproduceWith(otherParent.closestFlocking);
        var color = (this.color + otherParent.color) / 2;
        return new Genetics(preyFlocking, predatorFlocking, closestFlocking, color).mutate();
    };
    return Genetics;
})();
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
var GridNeighborDetector = (function () {
    function GridNeighborDetector(width, height, cellRadius) {
        this.width = width;
        this.height = height;
        this.cellRadius = cellRadius;
        if (width <= 0 || height <= 0 || cellRadius <= 0) {
            console.error("Invalid input to GridNeighborDetector constructor");
        }
        this.id2CellIndex = d3.map();
        this.cells = [];
        var xCells = Math.ceil(width / cellRadius);
        var yCells = Math.ceil(height / cellRadius);
        for (var i = 0; i < xCells; i++) {
            var row = [];
            for (var j = 0; j < yCells; j++) {
                row.push([]);
            }
            this.cells.push(row);
        }
    }
    GridNeighborDetector.prototype.neighbors = function (id) {
        if (!this.id2CellIndex.has(id)) {
            console.error("Invalid id", id, "passed to GND.neighbors");
        }
        var neighbors = [];
        var ij = this.id2CellIndex.get(id);
        var i = +(ij.split(",")[0]);
        var j = +(ij.split(",")[1]);
        for (var iOffset = -1; iOffset <= 1; iOffset++) {
            if (i + iOffset < 0 || i + iOffset >= this.cells.length)
                continue;
            for (var jOffset = -1; jOffset <= 1; jOffset++) {
                if (j + jOffset < 0 || j + jOffset >= this.cells[0].length)
                    continue;
                var cell = this.cells[i + iOffset][j + jOffset];
                neighbors = neighbors.concat(cell);
            }
        }
        return neighbors;
    };
    GridNeighborDetector.prototype.add = function (id, x, y) {
        x += this.width / 2;
        y += this.height / 2;
        return this._add(id, x, y);
    };
    GridNeighborDetector.prototype._add = function (id, x, y) {
        if (x < 0 || x > this.width || y < 0 || y > this.height) {
            console.error("Bad input id=", id, "x=", x, "y=", y, " to GND.add");
        }
        var i = Math.floor(x / this.cellRadius);
        var j = Math.floor(y / this.cellRadius);
        var ij = i.toString() + "," + j.toString();
        if (this.id2CellIndex.has(id)) {
            if (this.id2CellIndex.get(id) === ij) {
                return this;
            }
            else {
                this.remove(id);
            }
        }
        this.cells[i][j].push(id);
        this.id2CellIndex.set(id, ij);
        return this;
    };
    GridNeighborDetector.prototype.remove = function (id) {
        var ij = this.id2CellIndex.get(id);
        var i = +(ij.split(",")[0]);
        var j = +(ij.split(",")[1]);
        var cell = this.cells[i][j];
        var idx = cell.indexOf(id);
        if (idx === -1) {
            console.error("invalid index in GND.remove");
        }
        cell.splice(idx, 1);
        this.id2CellIndex.remove(id);
        return this;
    };
    return GridNeighborDetector;
})();
var testGND = (function () {
    var assertIsNeighbor = function (x1, y1, x2, y2) {
        var gnd = new GridNeighborDetector(400, 400, 50);
        var id1 = x1 + "," + y1;
        var id2 = x2 + "," + y2;
        gnd._add(id1, x1, y1);
        gnd._add(id2, x2, y2);
        if (gnd.neighbors(id1).length != 2) {
            console.error("expected", id1, "to be neighbor of", id2);
        }
    };
    var assertNotNeighbor = function (x1, y1, x2, y2) {
        var gnd = new GridNeighborDetector(400, 400, 50);
        var id1 = x1 + "," + y1;
        var id2 = x2 + "," + y2;
        gnd._add(id1, x1, y1);
        gnd._add(id2, x2, y2);
        if (gnd.neighbors(id1).length != 1) {
            console.error("expected", id1, "not to be neighbor of", id2);
        }
    };
    assertIsNeighbor(0, 0, 50, 50);
    assertIsNeighbor(0, 0, 99, 99);
    assertIsNeighbor(0, 0, 0, 99);
    assertIsNeighbor(0, 0, 0, 1);
    assertNotNeighbor(0, 0, 100, 100);
    assertNotNeighbor(0, 0, 0, 100);
})();
var NUM_NEIGHBORS_TO_SHOW = 7;
var RANGE_TO_CONSUME = 5;
var World = (function () {
    function World(radius, renderer) {
        this.radius = radius;
        this.renderer = renderer;
        this.nSteps = 0;
        var standardFlocking = { seperationWeight: 1, alignmentWeight: 1, cohesionWeight: 1 };
        var standardGenetics = { preyFlocking: standardFlocking, predatorFlocking: standardFlocking, targetFlocking: standardFlocking };
        this.predators = {};
        this.prey = {};
        this.neighborDetector = new GridNeighborDetector(this.radius * 2, this.radius * 2, C.NEIGHBOR_RADIUS);
        this.foodBackground = new FoodBackground(this.radius);
    }
    World.prototype.addPrey = function (g, position, velocity) {
        position = position ? position : newVector().randomize(this.radius * Math.random());
        velocity = velocity ? velocity : newVector().randomize(Prey.SPEED_FACTOR * C.BASE_SPEED);
        var p = new Prey(position, velocity, g);
        this.addBoid(p);
    };
    World.prototype.addPredator = function (g) {
        var position = newVector().randomize(this.radius * Math.random());
        var velocity = newVector().randomize(Prey.SPEED_FACTOR * C.BASE_SPEED);
        var p = new Predator(position, velocity, g);
        this.addBoid(p);
    };
    World.prototype.addBoid = function (b) {
        var addTo = b.isPrey ? this.prey : this.predators;
        var id = b.boidID;
        if (addTo[id]) {
            console.error("Duplicate boid with id", id);
        }
        addTo[id] = b;
    };
    World.prototype.killAllBoids = function () {
        var _this = this;
        var allBoids = boidsFromMap(this.prey).concat(boidsFromMap(this.predators));
        allBoids.forEach(function (b) { return _this.removeBoid(b); });
    };
    World.prototype.neighbors = function (b, prey) {
        var _this = this;
        var mapToSearch = prey ? this.prey : this.predators;
        var isRightType = function (id) { return !!mapToSearch[id]; };
        var inRange = function (x) { return b.position.distance(x.position, 0) <= C.NEIGHBOR_RADIUS; };
        var compareFn = function (b1, b2) {
            var d1 = b1.position.distance(b.position, _this.radius);
            var d2 = b2.position.distance(b.position, _this.radius);
            return d1 - d2;
        };
        var neighborsToCheck;
        if (b.isPrey) {
            neighborsToCheck = this.neighborDetector.neighbors(b.boidID).filter(isRightType).map(function (id) { return mapToSearch[id]; }).filter(inRange);
        }
        else {
            neighborsToCheck = boidsFromMap(mapToSearch);
        }
        return neighborsToCheck.sort(compareFn).slice(0, NUM_NEIGHBORS_TO_SHOW);
    };
    World.prototype.removeBoid = function (b) {
        var removeFrom = b.isPrey ? this.prey : this.predators;
        if (!removeFrom[b.boidID]) {
            console.error("tried to remove non-existent boid", b.boidID);
        }
        delete removeFrom[b.boidID];
        this.neighborDetector.remove(b.boidID);
    };
    World.prototype.reproduceBoid = function (mom) {
        var potentialParents = this.neighbors(mom, mom.isPrey);
        var dad;
        if (potentialParents.length == 1) {
            dad = mom;
        }
        else {
            var minDistance = Infinity;
            potentialParents.forEach(function (p) {
                var dist = p.position.distance(mom.position, 0);
                if (p != mom && dist < minDistance) {
                    minDistance = dist;
                    dad = p;
                }
            });
        }
        var newGenetics = mom.genetics.reproduceWith(dad.genetics);
        var cons = mom.isPrey ? Prey : Predator;
        var child = new cons(mom.position, mom.velocity, newGenetics);
        this.addBoid(child);
        child.food = mom.energyRequiredForReproduction / 4;
        mom.food -= mom.energyRequiredForReproduction / 2;
        mom.stepsSinceLastReproduction = 0;
    };
    World.prototype.step = function () {
        var _this = this;
        var allBoids = boidsFromMap(this.prey).concat(boidsFromMap(this.predators));
        allBoids.forEach(function (b) {
            _this.neighborDetector.add(b.boidID, b.position.x, b.position.y);
        });
        allBoids.forEach(function (b) {
            b.accelerate(_this);
        });
        allBoids.forEach(function (b) {
            b.step(_this.radius);
        });
        boidsFromMap(this.prey).forEach(function (p) {
            p.gainFood(_this.foodBackground.getFood(p.position, _this.nSteps));
        });
        var eatenThisTurn = {};
        boidsFromMap(this.predators).forEach(function (d) {
            boidsFromMap(_this.prey).forEach(function (y) {
                if (eatenThisTurn[y.boidID]) {
                    return;
                }
                if (d.position.distance(y.position, 0) <= RANGE_TO_CONSUME) {
                    d.gainFood(C.PREDATOR_FOOD_PER_PREY);
                    _this.removeBoid(y);
                    eatenThisTurn[y.boidID] = true;
                    d.busyEating = C.CONSUMPTION_TIME;
                }
            });
        });
        var nPredators = Object.keys(this.predators).length;
        var nPrey = Object.keys(this.prey).length;
        var nBoids = nPredators + nPrey;
        allBoids = boidsFromMap(this.prey).concat(boidsFromMap(this.predators));
        allBoids.forEach(function (b) {
            b.food -= b.foodEatenPerStep;
            if (b.canReproduce() && (nBoids < C.MAX_BOIDS || !b.isPrey)) {
                _this.reproduceBoid(b);
                nBoids++;
            }
            else if (b.food < 0) {
                if (!b.isPrey && nPredators <= C.MIN_NUM_PREDATORS && nPrey > 0) {
                    b.food = 0;
                    b.age = 0;
                }
                else {
                    _this.renderer.addCorpseToRender(b);
                    _this.removeBoid(b);
                }
            }
        });
        this.nSteps++;
    };
    World.prototype.render = function () {
        this.renderer.renderBoids(boidsFromMap(this.prey), true);
        this.renderer.renderBoids(boidsFromMap(this.predators), false);
        this.renderer.renderBackground(this.foodBackground);
        this.renderer.renderCorpses();
    };
    return World;
})();
var boidsFromMap = function (m) { return Object.keys(m).map(function (k) { return m[k]; }); };
function newVector() {
    if (C.COORDINATES_3D) {
        console.error("not implemented");
    }
    else {
        return new Vector2();
    }
}
var Vector2 = (function () {
    function Vector2(x, y) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        this.x = x;
        this.y = y;
        this.z = 0;
    }
    Vector2.prototype.clone = function () {
        return new Vector2(this.x, this.y);
    };
    Vector2.prototype.add = function (v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    };
    Vector2.prototype.subtract = function (v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    };
    Vector2.prototype.mult = function (scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    };
    Vector2.prototype.divide = function (scalar) {
        this.x /= scalar;
        this.y /= scalar;
        return this;
    };
    Vector2.prototype.distance = function (v, radius) {
        if (radius == 0 || true) {
            return Math.sqrt(Math.pow(v.x - this.x, 2) + Math.pow(v.y - this.y, 2));
        }
        else {
            var targetWrappedWrtThisVector = v.clone().subtract(this).wrap(radius);
            var dx = targetWrappedWrtThisVector.x;
            var dy = targetWrappedWrtThisVector.y;
            return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
        }
    };
    Vector2.prototype.limit = function (magnitude) {
        var n = this.norm();
        if (n > magnitude) {
            this.mult(magnitude / n);
        }
        return this;
    };
    Vector2.prototype.normSq = function () {
        return Math.pow(this.x, 2) + Math.pow(this.y, 2);
    };
    Vector2.prototype.norm = function () {
        return Math.sqrt(this.normSq());
    };
    Vector2.prototype.normalize = function (norm) {
        if (norm === void 0) { norm = 1; }
        this.mult(norm / this.norm());
        return this;
    };
    Vector2.prototype.randomize = function (norm) {
        if (norm === void 0) { norm = 1; }
        this.x = Math.random() - .5;
        this.y = Math.random() - .5;
        this.normalize(norm);
        return this;
    };
    Vector2.prototype.wrap = function (radius) {
        var zero = new Vector2();
        var dist = zero.distance(this, 0);
        if (dist <= radius)
            return this;
        var vectorOnEdgeOfCircle = this.clone().limit(radius).mult(-2);
        this.add(vectorOnEdgeOfCircle);
        return this.wrap(radius);
    };
    return Vector2;
})();
var world;
window.onload = function () {
    var renderer = new Renderer2D(400, "#outer");
    world = new World(400, renderer);
    for (var i = 0; i < 5; i++) {
        var flockPosition = newVector().randomize(400 * 0.5);
        for (var j = 0; j < 10; j++) {
            world.addPrey(flockingPreyGenetics(), newVector().randomize(Math.random() * 30).add(flockPosition), newVector());
        }
    }
    var nonFlockPosition = newVector().randomize(400 * 0.5);
    for (var i = 0; i < 10; i++) {
        world.addPrey(nonFlockingPreyGenetics(), newVector().randomize(400 * Math.random()), newVector());
    }
    for (var i = 0; i < 5; i++) {
        world.addPredator(predatorGenetics());
    }
    var go = function () {
        world.render();
        world.step();
    };
    setInterval(go, 16);
    document.getElementById("addPredator").onclick = addPredator;
    document.getElementById("addFlocking").onclick = addFlockingPrey;
    document.getElementById("addNonFlocking").onclick = addNonFlockingPrey;
    document.getElementById("killAll").onclick = killAllBoids;
};
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
var Quadtree = (function () {
    function Quadtree() {
    }
    return Quadtree;
})();
var PREY_SIZE = 1;
var PREDATOR_SIZE = 2;
var Renderer2D = (function () {
    function Renderer2D(radius, divID) {
        this.radius = radius;
        this.foodCounter = 0;
        this.corpsesToRender = [];
        this.div = d3.select(divID);
        this.canvas = this.div.append("canvas").attr("width", this.radius * 2).attr("height", this.radius * 2).node();
        this.svg = this.div.append("svg").attr("width", this.radius * 2).attr("height", this.radius * 2);
        this.prey = this.svg.append("g").classed("prey", true);
        this.predators = this.svg.append("g").classed("predators", true);
        var ctx = this.canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(this.radius, this.radius, this.radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = "rgb(255,255,255)";
        ctx.fill();
        ctx.fillStyle = "rgba(0, 255, 0," + C.FOOD_STARTING_LEVEL + ")";
        ctx.fill();
        ctx.closePath();
    }
    Renderer2D.prototype.renderBoids = function (boids, isPrey) {
        var _this = this;
        var selection = isPrey ? this.prey : this.predators;
        var colorF = function (b) {
            return "hsl(" + b.genetics.color + ",100%, 50%)";
        };
        var update = selection.selectAll("circle").data(boids, function (b) { return b.boidID; });
        update.enter().append("circle").attr("r", function (d) { return d.radius; }).attr("fill", colorF);
        update.attr("cx", function (d) { return d.position.x + _this.radius; }).attr("cy", function (d) { return d.position.y + _this.radius; });
        update.exit().remove();
    };
    Renderer2D.prototype.addCorpseToRender = function (boid) {
        this.corpsesToRender.push(boid);
    };
    Renderer2D.prototype.renderCorpses = function () {
        var _this = this;
        var ctx = this.canvas.getContext('2d');
        this.corpsesToRender.forEach(function (b) {
            ctx.fillStyle = "rgb(0,0,0)";
            ctx.beginPath();
            ctx.arc(b.position.x + _this.radius, b.position.y + _this.radius, b.radius, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.closePath();
        });
        this.corpsesToRender = [];
    };
    Renderer2D.prototype.renderBackground = function (f) {
        var _this = this;
        var ctx = this.canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(this.radius, this.radius, this.radius, 0, 2 * Math.PI, false);
        if (this.foodCounter++ === Math.round(C.FOOD_STEPS_TO_REGEN / 100)) {
            ctx.fillStyle = "rgba(0,255,0, 0.01)";
            ctx.fill();
            ctx.closePath();
            this.foodCounter = 0;
        }
        var eatenThisTurn = f.eatenThisTurn();
        eatenThisTurn.forEach(function (xy) {
            ctx.fillStyle = "rgb(255,255,255)";
            ctx.beginPath();
            ctx.arc(xy[0] + _this.radius, xy[1] + _this.radius, 1, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.closePath();
        });
    };
    return Renderer2D;
})();
