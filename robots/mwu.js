var _ = require("underscore");

var MWURobot = function(obj) {
    var self = this;
    self.costs = obj.costs;
    self.epsilon = obj.epsilon;
    self.precision = obj.precision;
    self.movesAllowed = self.costs.length;
    self.atPure = false;
    self.maxed = _.range(self.movesAllowed).map(function(d) { return false; });

    self.initializeWeights = function() {
        var probs = [];
        var sum = 0;
        for (var i = 0; i < self.movesAllowed; i++) {
            probs[i] = Math.random();
            sum += probs[i];
        }
        for (var i = 0; i < self.movesAllowed; i++) {
            probs[i] /= sum;
        }
        return probs;
    }

    self.weights = self.initializeWeights();

    self.updateWeights = function(mixedStrategies) {
        var summedMixedStrategies = mixedStrategies.reduce(function(a, b) {
            return a.map(function(d, i) { return d+b[i]; });
        }, mixedStrategies[0].map(function(d) { return 0; }));
        var totalCosts = 0;
        var rightCosts = self.costs.map(function(d, i) {
            var rightCost = summedMixedStrategies.reduce(function(a, b, j) {
                return a + b*d[j];
            }, 0);
            totalCosts += self.weights[i]*rightCost;
            return rightCost;
        });
        for (var i = 0, c = self.weights.length; i < c; i++) {
            if (!self.maxed[i]) {
                self.weights[i] *= (1 - self.epsilon * rightCosts[i]) / (1 - self.epsilon * totalCosts);
                if (self.weights[i] < self.precision || self.weights[i] > 1-self.precision) self.maxed[i] = true;
                if (self.weights[i] < self.precision) self.weights[i] = self.precision;
                if (self.weights[i] > 1-self.precision) self.weights[i] = 1-self.precision;
            }
        }
        if (_.every(self.maxed)) {
            self.atPure = true;
        }
    };

    self.move = function() {
        var totalWeight = self.weights.reduce(function(a, b) { return a+b; }, 0);
        var pt = Math.random() * totalWeight;
        var tempSum = 0;
        for (var i = 0; i < self.movesAllowed; i++) {
            tempSum += self.weights[i];
            if (tempSum > pt) {
                return i;
            }
        }
    };
};

module.exports = MWURobot;
