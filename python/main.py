import graphcoloring as gc
import argparse
import json

parser = argparse.ArgumentParser()
parser.add_argument('-n', '-network', type=str, default='', help='network', metavar='n')
args = parser.parse_args()

with open("tmp/network.json") as data_file:
    data = json.load(data_file)
    print gc.getChromaticNumber(data["edges"])
