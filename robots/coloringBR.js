var _ = require("underscore");

var ColoringBR = function(obj) {
    this._neighbors = obj.neighbors;
    this._colorsAllowed = obj.colorsAllowed;
}

ColoringBR.prototype.updateState = function(obj) {
    this._neighbors.find(function(d) { return d.nid == obj.nid; }).state = obj.state;
}

ColoringBR.prototype.move = function() {
    var self = this;

    var colors = _.range(self._colorsAllowed).map(function(d) { return 0; });
    for (var i = 0, c = self._neighbors.length; i < c; i++) {
        colors[self._neighbors[i].state]++;
    }
    var min = _.min(colors);
    var argmin = [];
    for (var i = 0; i < self._colorsAllowed; i++) {
        if (colors[i] == min) argmin.push(i);
    }
    var move = argmin[Math.floor(Math.random() * argmin.length)];

    return move;
}

module.exports = ColoringBR;
