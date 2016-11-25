from gurobipy import *
import numpy as np

def getChromaticNumber(graph, bound=10):
    # returns chromatic number of a given graph
    nodes = max([max(d[0], d[1]) for d in graph])+1
    m = Model("chrom")
    x = {}
    y = {}
    for c in range(0, bound):
        y[c] = m.addVar(name=('y%s' % c), vtype=GRB.BINARY, obj=1)
        for n in range(0, nodes):
            name = ('x%s' % str((n,c)))
            x[(n,c)] = m.addVar(name=name, obj=0, vtype=GRB.BINARY)

    m.update()
    m.setParam('OutputFlag', False)

    for edge in graph:
        for c in range(0, bound):
            name = ("edge%s-%s,%s" % (str(edge[0]), str(edge[1]), c))
            m.addConstr(x[(edge[0],c)] + x[(edge[1],c)] <= 1, name=name)

    for n in range(0, nodes):
        name = ("node%s" % str(n))
        m.addConstr(quicksum(x[(n,c)] for c in range(0, bound)) == 1, name)
        for c in range(0, bound):
            m.addConstr(x[(n,c)] <= y[c])

    m.optimize()
    resobj = m.objVal
    return resobj
