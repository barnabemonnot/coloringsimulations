var _ = require("underscore");

var a = [];
var n = 1000000;
var b = _.range(n);
var neighbors = _.range(n).map(function(d) {
    return {
        nid: d,
        state: Math.floor(Math.random(2) * 5)
    };
});
var colors = [0, 0, 0, 0, 0];
var start = Date.now();
// for (var i = 0; i < n; i++) a.push(i);
// b.forEach(function(d) { a.push(d) });

// neighbors.forEach(function(d) {
//     colors[d.state]++;
// });
for (var i = 0, c = neighbors.length; i < c; i++) {
    colors[neighbors[i].state]++;
}
var end = Date.now();
console.log("colors is:", colors);
console.log("time is:", end-start);
