var _ = require("underscore");

var ColoringBR = function(obj) {
    var self = this;
    self._neighbors = obj.neighbors;
    self._colorsAllowed = obj.colorsAllowed;
    self._strict = obj.strict;
    self._currentState = obj.currentState;
    self._pickLowestColor = false;

    self.getCurrentMin = function() {
        return self._neighbors.filter(function(d) { return d.state == self._currentState; }).length;
    };

    self._currentMin = self.getCurrentMin();

    self.updateState = function(obj) {
        self._neighbors.find(function(d) { return d.nid == obj.nid; }).state = obj.state;
        self._currentMin = self.getCurrentMin();
    };

    self.move = function() {
        var self = this;

        var colors = _.range(self._colorsAllowed).map(function(d) { return 0; });
        for (var i = 0, c = self._neighbors.length; i < c; i++) {
            colors[self._neighbors[i].state]++;
        }
        var min = _.min(colors);
        if (self._strict && self._currentMin == min) {
            return self._currentState;
        }
        var argmin = [];
        for (var i = 0; i < self._colorsAllowed; i++) {
            if (colors[i] == min) argmin.push(i);
        }
        var move = (self._pickLowestColor ? argmin[0] : argmin[Math.floor(Math.random() * argmin.length)]);
        self._currentState = move;
        self._currentMin = min;
        return move;
    };
};

module.exports = ColoringBR;
