var _ = require("underscore");
var PythonShell = require("python-shell");
var jsonfile = require("jsonfile");

var getNodes = function(graph) {
	return _.unique(graph.reduce(function(a, b) {
		return a.concat(b);
	}, []));
}

var getNeighbors = function(edges, nid) {
	var neighbors = [];
	for (var i = 0, c = edges.length; i < c; i++) {
		if (edges[i][0] == nid && neighbors.indexOf(edges[i][1]) == -1) neighbors.push(edges[i][1]);
		if (edges[i][1] == nid && neighbors.indexOf(edges[i][0]) == -1) neighbors.push(edges[i][0]);
	}
	return neighbors;
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

var createRingGraph = function(n, t) {
	if (!t) t = 0;
	return _.range(n).map(function(d) {
		return [d+t, ((d+1) % n) + t];
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
};

var createCliqueChainRewired = function(nc, c, q) {
	// nc = number of cliques
	// c = size of the clique
	// q = rewiring probability
	var edges = createCliqueChain(nc, c, 1);
	for (var i = 0, e = edges.length; i < e; i++) {
		var src = edges[i][0];
		var tgt = edges[i][1];
		if (Math.floor(src/c) == Math.floor(tgt/c)) { // the edge is in a clique
			var rewire = Math.random() < q;
			if (rewire) { // rewire the edge, find a new tgt
				var newTgt = tgt;
				while (src == newTgt || _.findIndex(edges, function(d) {
					return (_.isEqual(d, [src, newTgt]) || _.isEqual(d, [newTgt, src]));
				}) > -1) {
					newTgt = Math.floor(Math.random() * nc * c);
				}
				edges[i][1] = newTgt;
			}
		}
	}
	return edges;
};

var createTreeGraph = function(n, m) {
	// n = vertices in the graph
	// m = branches per node
	var edges = [];
	var depth = Math.floor(Math.log(n) / Math.log(m)) + 1;
	var previousLevel = [0];
	var currentNode = 1;
	for (var i = 1; i < depth; i++) {
		var newLevel = [];
		for (var j = 0, c = previousLevel.length; j < c; j++) {
			for (var k = 0; k < m; k++) {
				if (currentNode == n) return edges;
				edges.push([previousLevel[j], currentNode]);
				newLevel.push(currentNode);
				currentNode++;
			}
		}
		previousLevel = newLevel;
	}
	return edges;
}

var createCylinderGraph = function(nc, c) {
	// nc = number of rings
	// c = nodes per rings
	var edges = [];
	for (var i = 0; i < nc; i++) {
		var ring = createRingGraph(c, i*c);
		edges = edges.concat(ring);
		if (i > 0) {
			for (var j = 0; j < c; j++) {
				edges.push([(i-1)*c+j, i*c+j]);
			}
		}
	}
	return edges;
}

var createBAGraph = function(n, m) {
	// n = vertices in graph
	// m = edges that new vertices form
	var edges = [];
	var nodes = [];
	for (var i = 0; i < n; i++) {
		nodes.push({
			nid: i,
			degree: 0
		});
		var newEdges = [];
		for (var j = 0; j < m; j++) {
			if (nodes.length == 1) continue;
			if (nodes.length-1 <= m) {
				if (j < nodes.length - 1) {
					newEdges.push([i, nodes[j].nid]);
					nodes[i].degree++;
					nodes[nodes[j].nid].degree++;
				}
			} else {
				while (newEdges.length < m) {
					var sum = nodes.filter(function(d) { return d.nid != i })
						.reduce(function(a, b) { return a + b.degree; }, 0);
					var pt = Math.random();
					var cume = 0;
					var selected = 0;
					for (var p = 0; p < nodes.length - 1; p++) {
						cume += nodes[p].degree / sum;
						if (cume > pt) {
							selected = p;
							break;
						}
					}
					if (_.findIndex(newEdges, function(d) { return _.isEqual([i, p], d); }) == -1) {
						newEdges.push([i, p]);
						nodes[i].degree++;
						nodes[p].degree++;
					}
				}
			}
		}
		edges = edges.concat(newEdges);
	}
	return edges;
}

var getChromaticNumber = function(edges, cb) {
	var file = "tmp/network.json"
	var obj = { edges: edges };
	jsonfile.writeFile(file, obj, function(err) {
	  	if (err) return cb(err);
		var pyshell = new PythonShell("python/main.py");
		pyshell.on('message', function (message) {
			return cb(null, parseInt(message));
		});
  	});
};

module.exports = {
	getNeighbors: getNeighbors,
    checkColoring: checkColoring,
	checkInfluence: checkInfluence,
    subgraphForNodes: subgraphForNodes,
    collisionsInGraph: collisionsInGraph,
    collisionsInGraphForNode: collisionsInGraphForNode,
    collisionsInGraphForNodes: collisionsInGraphForNodes,
	createGridGraph: createGridGraph,
	createERGraph: createERGraph,
	createBAGraph: createBAGraph,
	createRingGraph: createRingGraph,
	createTreeGraph: createTreeGraph,
	createCylinderGraph: createCylinderGraph,
	createCliqueNetwork: createCliqueNetwork,
	createCliqueChain: createCliqueChain,
	createCliqueChainRewired: createCliqueChainRewired,
	getChromaticNumber: getChromaticNumber,

	payoffInNetworkForNode: payoffInNetworkForNode
}
