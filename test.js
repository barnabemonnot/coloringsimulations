var assert = require("assert");
var ColoringBR = require("./robots/coloringBR");
var MWURobot = require("./robots/mwu");

var network = {
    edges: [[0, 1], [0, 2]],
    nodes: 3,
    colorsNeeded: 2
};
var precision = Math.pow(10, -6);
var states = [0, 0, 0];
var brMachine = new ColoringBR({
    neighbors: [
        { nid: 1, state: 0 },
        { nid: 2, state: 0 }
    ],
    colorsAllowed: network.colorsNeeded,
    strict: false,
    currentState: 0
});

var mwuRobot = new MWURobot({
    costs: [
        [1, 0],
        [0, 1]
    ],
    epsilon: 0.1
});

describe("br robot features", function() {
    it("picks the correct color when there is no ambiguity", function() {
        assert.equal(brMachine.move(), 1);
    });
    it("updates its current state properly", function() {
        assert.equal(brMachine._currentState, 1);
    });
    it("updates its minimum properly", function() {
        assert.equal(brMachine._currentMin, 0);
    });
});

describe("neighbor is updating", function() {
    before(function() {
        brMachine.updateState({ nid: 1, state: 1 });
    });
    it("neighbor moves: state is updated", function() {
        assert.equal(brMachine._neighbors[0].state, 1);
    });
    it("neighbor moves: minimum is updated", function() {
        assert.equal(brMachine._currentMin, 1);
    });
});

describe("strict robot will not change opinion", function() {
    before(function() {
        brMachine._strict = true;
    });
    it("does not move if no strictly profitable deviation", function() {
        assert.equal(brMachine.move(), 1);
    });
});

describe("mwu robot features", function() {
    it("initialized weights sum to 1", function() {
        assert(Math.abs(mwuRobot.weights.reduce(function(a, b) { return a+b; }, 0)-1) < precision);
    });
});
