var graphUtilities = require("./graphUtilities");
var _ = require("underscore");

var edges = graphUtilities.createTreeGraph(31, 2);
graphUtilities.getChromaticNumber(edges, function(err, chromaticNumber) {
    if (err) return console.log(err);
    console.log({
        edges: edges,
        nodes: 31,
        colorsNeeded: chromaticNumber
    });
});
