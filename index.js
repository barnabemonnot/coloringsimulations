var ColoringSimulation = require("./ColoringSimulation");
var networks = require("./networks.json");

for (var i = 0; i < networks.length; i++) {
    var simulation = new ColoringSimulation({
        networkName: i+"-sim"
    });
    simulation.simultaneous = 1/10;
    simulation.network = networks[i];
    simulation.run();
    simulation.saveFile();
}
