var _ = require("underscore");
var graphUtilities = require("./graphUtilities");
var ColoringBR = require("./robots/coloringBR");
var MWURobot = require("./robots/mwu");
var toCSV = require("array-to-csv");
var fs = require("fs");
var networks = require("./networks.json");

var ColoringSimulation = function(obj) {
    var self = this;
    self.runs = 10000;
    self.network;
    self.movesAllowed = 900; // assuming 1 move per second, this is 15 mins of play
    self.rails = [];
    self.results;
    self.randomStates = false;
    self.strict = false;
    self.printSome = false;
    self.printMore = false;
    self.networkName = obj.networkName;
    self.simultaneous = 0; // in [0, 1]
    self.machineType = "mwu"; // in ["mwu", "br"]
    self.precision = Math.pow(10, -5);

    self.run = function() {
        var network = self.network;
        var results = [];
        for (var t = 0; t < self.runs; t++) {
            if (self.printLittle && t % 1000 == 0) console.log("run", t);
            if (self.printSome && t % 100 == 0) console.log("run", t);
            if (self.printMore && t % 10 == 0) console.log("run", t);
            var states = _.range(network.nodes).map(function() {
                return (self.randomStates ? Math.floor(Math.random() * network.colorsNeeded) : 0);
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
                if (self.machineType == "br") {
                    return new ColoringBR({
                        neighbors: neighbors,
                        colorsAllowed: network.colorsNeeded,
                        strict: self.strict,
                        currentState: d
                    });
                } else if (self.machineType == "mwu") {
                    var costs = _.range(network.colorsNeeded).map(function(i) {
                        return _.range(network.colorsNeeded).map(function(j) {
                            return (i == j ? 1 : 0);
                        });
                    });
                    return new MWURobot({
                        costs: costs,
                        epsilon: 0.1,
                        precision: self.precision
                    });
                } else {
                    console.log("bleh?");
                }
            });
            var solutionFound = false, numberOfSteps = 0, rounds = [], terminated = false;
            for (var moveIdx = 0; moveIdx < self.movesAllowed; moveIdx++) {
                if (self.simultaneous == 0) {
                    var machineIdx;
                    if (moveIdx >= self.rails.length) machineIdx = Math.floor(Math.random() * machines.length);
                    else machineIdx = self.rails[moveIdx];
                    var machine = machines[machineIdx];
                    if (self.machineType == "br") {
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
                            numberOfSteps = moveIdx+1;
                            break;
                        }
                    } else if (self.machineType == "mwu") {
                        var neighbors = graphUtilities.getNeighbors(network.edges, machineIdx);
                        machine.updateWeights(neighbors.map(function(n) { return machines[n].weights; }));
                        var atPure = _.every(machines, function(machine) { return machine.atPure; });
                        if (atPure) {
                            states = machines.map(function(machine) {
                                return _.max(
                                    machine.weights.map(function(weight, i) { return [i, weight]; }),
                                    function(elem) { return elem[1]; }
                                )[0]
                            });
                            if (graphUtilities.checkColoring(network.edges, states)) {
                                solutionFound = true;
                                numberOfSteps = moveIdx+1;
                            }
                            terminated = true;
                            break;
                        }
                    } else {
                        console.log("bleh?");
                    }
                }
                else {
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
                rounds.push(states.map(function(d) { return d; }));
            }
            var obj;
            if (solutionFound) {
                obj = [0, numberOfSteps];
            }
            else {
                if (self.machineType == "br") {
                    var lookback = (self.movesAllowed > 100 ? 100 : Math.floor(self.movesAllowed * 0.9));
                    var stuck = _.every(rounds.filter(function(d, i) {
                        return i >= rounds.length - lookback;
                    }).map(function(d, i) {
                        return _.isEqual(rounds[rounds.length - lookback + i-1], rounds[rounds.length - lookback + i]);
                    }));
                    obj = [(stuck ? 1 : 2), graphUtilities.collisionsInGraph(network.edges, states)];
                } else if (self.machineType == "mwu") {
                    if (terminated) {
                        obj = [1, graphUtilities.collisionsInGraph(network.edges, states)];
                    } else {
                        machines.filter(function(d) {
                            return !d.atPure;
                        }).forEach(function(d) {
                            if (_.every(d.weights, function(weight) {
                                return (weight < Math.sqrt(self.precision) || weight > 1-Math.sqrt(self.precision));
                            })) {
                                d.atPure = true;
                            }
                        });
                        var atPure = _.every(machines, function(machine) { return machine.atPure; });
                        if (atPure) {
                            states = machines.map(function(machine) {
                                return _.max(
                                    machine.weights.map(function(weight, i) { return [i, weight]; }),
                                    function(elem) { return elem[1]; }
                                )[0]
                            });
                            if (graphUtilities.checkColoring(network.edges, states)) {
                                obj = [0, self.movesAllowed];
                            } else {
                                obj = [1, graphUtilities.collisionsInGraph(network.edges, states)];
                            }
                        } else {
                            obj = [2, 0];
                        }
                    }
                } else {
                    console.log("bleh?");
                }
            }
            // if (_.isEqual(obj, [2, 0])) console.log(machines);
            results.push(obj);
        }
        var resultsHeader = [["status", "info"]]; // status, 0 = done; 1 = fail, stuck; 2 = fail, cycle;
        self.results = resultsHeader.concat(results);
        var maxCollisions = (results.filter(function(d) {
            if (self.machineType == "br") {
                return d[0] > 0;
            } else if (self.machineType == "mwu") {
                return d[0] == 1;
            }
        }).length > 0 ?
            _.max(results.filter(function(d) {
                if (self.machineType == "br") {
                    return d[0] > 0;
                } else if (self.machineType == "mwu") {
                    return d[0] == 1;
                }
            }), function(d) { return d[1]; })[1] :
        0);
        var eqs = _.range(maxCollisions+1).map(function(d) { return 0; });
        results.forEach(function(d) {
            if (self.machineType == "br") {
                if (d[0] == 0) eqs[0]++;
                else eqs[d[1]]++;
            } else if (self.machineType == "mwu") {
                if (d[0] == 0) eqs[0]++;
                else if (d[0] == 1) eqs[d[1]]++;
            }
        });
        self.equilibriumResults = eqs;
    };

    self.saveResults = function() {
        fs.writeFile("results/results-"+self.networkName+".csv", toCSV(self.results), function(err) {
            if (err) return console.log(err);
            return console.log("file saved!");
        });
    };

    self.saveEquilibriumResults = function() {
        fs.writeFile("results/equilibriumResults-"+self.networkName+"-mwu.csv", toCSV(self.equilibriumResults), function(err) {
            if (err) return console.log(err);
            return console.log("file saved!");
        });
    }
};

module.exports = ColoringSimulation;
