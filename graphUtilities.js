var _ = require("underscore");

var getNodes = function(graph) {
	return _.unique(graph.reduce(function(a, b) {
		return a.concat(b);
	}, []));
}

var checkColoring = function(graph, states) {
	for (var i = 0, c = graph.length; i < c; i++) {
		if (states[graph[i][0]] == states[graph[i][1]]) {
			return false;
		}
	}
	return true;
};

var checkInfluence = function(states, colorsAllowed) {
	// Heavy duty solution
	return _.some(_.range(colorsAllowed).map(function(d) {
		return _.every(states, function(state) {
			return state == d;
		});
	}));

	// More elegant one
}

var subgraphForNodes = function(graph, nodes) {
    return graph.filter(function(edge) {
            return typeof(edge.find(function(ext) {
                return nodes.indexOf(ext) > -1;
            })) !== "undefined";
        });
}

var payoffInNetworkForNode = function(edges, states, payoffMatrix, nid) {
	var payoff = 0;
	var neighbors = [];
	for (var i = 0, c = edges.length; i < c; i++) {
		if ((edges[i][0] == nid || edges[i][1] == nid)) {
			var neighbor;
			if (edges[i][0] == nid) {
				neighbor = edges[i][1];
				neighbors.push(neighbor);
			} else {
				neighbor = edges[i][0];
				neighbors.push(neighbor);
			}
			payoff += payoffMatrix[states[nid]][states[neighbor]][0];
		}
	}
	return {
		payoff: payoff,
		neighbors: neighbors
	};
}

// var payoffInNetworkForNodes = function()

var collisionsInGraph = function(graph, states) {
	var collisions = 0;
	for (var i = 0, c = graph.length; i < c; i++) {
		if (states[graph[i][0]] == states[graph[i][1]]) {
			collisions++;
		}
	}
	return collisions;
};

var collisionsInGraphForNode = function(graph, states, nid) {
	var collisions = 0;
	var neighbors = [];
	for (var i = 0, c = graph.length; i < c; i++) {
		if ((graph[i][0] == nid || graph[i][1] == nid)) {
			if (graph[i][0] == nid) {
				neighbors.push(graph[i][1]);
			} else {
				neighbors.push(graph[i][0]);
			}
			if (states[graph[i][0]] == states[graph[i][1]]) {
				collisions++;
			}
		}
	}
	return {
		collisions: collisions,
		neighbors: neighbors
	};
};

var collisionsInGraphForNodes = function(graph, states, nodes, node) {
    var neighbors;
	if (node) {
		var collisions = nodes.reduce(function(a, b) {
	        var obj = collisionsInGraphForNode(graph, states, b);
	        if (b == node) {
	            neighbors = obj.neighbors;
	        }
	        return obj.collisions + a;
	    }, 0);
	    return {
	        collisions: collisions,
	        neighbors: neighbors
	    };
	} else {
		var ret = nodes.reduce(function(a, b) {
	        var obj = collisionsInGraphForNode(graph, states, b);
	        return {
				collisions: obj.collisions + a.collisions,
				neighbors: a.neighbors.concat(obj.neighbors)
			};
	    }, {
			collisions: 0,
			neighbors: []
		});
	    return {
	        collisions: ret.collisions,
	        neighbors: _.uniq(ret.neighbors)
	    };
	}
}

function coordToNode(x, y, n) {
	return x * n + y;
}

function connect(x1, y1, x2, y2, a, n, target) {
	var src = coordToNode(x1, y1, n);
	var tgt = coordToNode(x2, y2, n);
	if (target == -1 || (src < target && tgt < target)) a.push([src, tgt]);
	return a;
}

var createGridGraph = function(m, n, target) {
	if (!target) target = -1;
	if (target > m * n) return null;

	a = [];
	for (var i = 0; i < m; i++) {
		for (var j = 0; j < n; j++) {
			if (i != m-1) a = connect(i, j, i+1, j, a, n, target);
			if (j != n-1) a = connect(i, j, i, j+1, a, n, target);
		}
	}
	return a;
}

var createERGraph = function(n, p) {
	if (p > 1) p = 1;
	if (p < 0) p = 0;
	var a = [];
	for (var i = 0; i < n; i++) {
		for (var j = i+1; j < n; j++) {
			var pt = Math.random();
			if (pt < p) {
				a.push([i, j])
			}
		}
	}
	return a;
}

var createRingGraph = function(n) {
	return _.range(n).map(function(d) {
		return [d, (d+1) % n];
	});
};

var createCliqueNetwork = function(n, t) {
	// n = clique size
	// t = translation of index
	if (!t) t = 0;
	var edges = [];
	for (var i = 0; i < n; i++) {
		for (var j = i + 1; j < n; j++) {
			edges.push([i+t, j+t]);
		}
	}
	return edges;
}

var createCliqueChain = function(nc, c, m) {
	// nc = number of cliques
	// c = size of the clique
	// m = edges between cliques
	var edges = [];
	if (m > c*c) return null;
	for (var i = 0; i < nc; i++) {
		edges = edges.concat(createCliqueNetwork(c, i*c));
		if (i > 0) {
			var newEdges = [];
			var appended = 0;
			while (appended < m) {
				var src = Math.floor(Math.random() * c) + (i-1)*c;
				var tgt = Math.floor(Math.random() * c) + i*c;
				if (_.findIndex(newEdges, function(d) { return _.isEqual([src, tgt], d); }) == -1) {
					appended++;
					newEdges.push([src, tgt]);
				}
			}
			edges = edges.concat(newEdges);
		}
	}
	return edges;
}

module.exports = {
    checkColoring: checkColoring,
	checkInfluence: checkInfluence,
    subgraphForNodes: subgraphForNodes,
    collisionsInGraph: collisionsInGraph,
    collisionsInGraphForNode: collisionsInGraphForNode,
    collisionsInGraphForNodes: collisionsInGraphForNodes,
	createGridGraph: createGridGraph,
	createERGraph: createERGraph,
	createRingGraph: createRingGraph,
	createCliqueNetwork: createCliqueNetwork,
	createCliqueChain: createCliqueChain,

	payoffInNetworkForNode: payoffInNetworkForNode
}
