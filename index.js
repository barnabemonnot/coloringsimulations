var ColoringSimulation = require("./ColoringSimulation");
var networks = require("./networks.json");
var _ = require("underscore");
var toCSV = require("array-to-csv");
var fs = require("fs");

// var networksIdx = _.range(networks.length);
var networksIdx = [0, 4, 5, 7, 8, 9, 10, 11, 12];
// var networksIdx = [7];
var fullResults = [];
for (var n in networksIdx) {
    var i = networksIdx[n];
    var simulation = new ColoringSimulation({
        networkName: i
    });
    // simulation.simultaneous = 1/10;
    simulation.printLittle = true;
    // simulation.printSome = true;
    // simulation.printMore = true;
    simulation.runs = 10000;
    simulation.strict = true;
    simulation.movesAllowed = 20000;
    simulation.machineType = "mwu";
    simulation.network = networks[i];
    simulation.run();
    fullResults.push(simulation.equilibriumResults);
    fs.writeFileSync("results/equilibriumResults-mwu.csv", toCSV(fullResults));
    console.log("finished one!!", i);
    console.log(fullResults);
    // simulation.saveFile();
}
