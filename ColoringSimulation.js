var _ = require("underscore");
var graphUtilities = require("./graphUtilities");
var ColoringBR = require("./robots/coloringBR");
var toCSV = require("array-to-csv");
var fs = require("fs");
var networks = require("./networks.json");

var ColoringSimulation = function(obj) {
    var self = this;
    self.runs = 10000;
    self.network;
    self.movesAllowed = 900; // assuming 1 move per second, this is 15 mins of play
    self.machine = ColoringBR;
    self.rails = [];
    self.results;
    self.networkName = obj.networkName;
    self.simultaneous = 0; // in [0, 1]

    self.run = function() {
        var network = self.network;
        var results = [["status", "info"]];
        for (var t = 0; t < self.runs; t++) {
            var states = _.range(network.nodes).map(function(d) {
                return 0;
            });
            var machines = states.map(function(d, i) {
                var neighbors = graphUtilities.collisionsInGraphForNode(
                    network.edges,
                    states,
                    i
                ).neighbors.map(function(n) {
                    return {
                        nid: n,
                        state: 0
                    };
                });
                var machine = new self.machine({
                    neighbors: neighbors,
                    colorsAllowed: network.colorsNeeded
                });
                return machine;
            });
            var solutionFound = false, numberOfSteps = 0;
            for (var i = 0; i < self.movesAllowed; i++) {
                if (self.simultaneous == 0) {
                    var machineIdx;
                    if (i >= self.rails.length) machineIdx = Math.floor(Math.random() * machines.length);
                    else machineIdx = self.rails[i];
                    var machine = machines[machineIdx];
                    var move = machine.move();
                    states[machineIdx] = move;
                    var neighbors = graphUtilities.collisionsInGraphForNode(network.edges, states, machineIdx).neighbors;
                    neighbors.forEach(function(n) {
                        machines[n].updateState({
                            nid: machineIdx,
                            state: move
                        });
                    });
                    var done = graphUtilities.checkColoring(network.edges, states);
                    if (done) {
                        solutionFound = true;
                        numberOfSteps = i+1;
                        break;
                    }
                } else {
                    var calledMachines = [], moves = [];
                    for (var m = 0; m < machines.length; m++) {
                        if (Math.random() < self.simultaneous) {
                            calledMachines.push(m);
                            var move = machines[m].move();
                            moves.push(move);
                            states[m] = move;
                            numberOfSteps++;
                        }
                    }
                    for (var m = 0; m < calledMachines.length; m++) {
                        var neighbors = graphUtilities.collisionsInGraphForNode(network.edges, states, calledMachines[m]).neighbors;
                        neighbors.forEach(function(n) {
                            machines[n].updateState({
                                nid: calledMachines[m],
                                state: moves[m]
                            });
                        });
                    }
                    var done = graphUtilities.checkColoring(network.edges, states);
                    if (done) {
                        solutionFound = true;
                        break;
                    }
                }
            }

            var obj;
            if (solutionFound) obj = [1, numberOfSteps];
            else obj = [0, graphUtilities.collisionsInGraph(network.edges, states)];

            results.push(obj);
        }
        self.results = results;
    };

    self.saveFile = function() {
        fs.writeFile("results/results-"+self.networkName+".csv", toCSV(self.results), function(err) {
            if (err) return console.log(err);
            return console.log("file saved!");
        });
    };
};

module.exports = ColoringSimulation;
