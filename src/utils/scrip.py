import csv
import json

l = []

with open("citydata.csv", mode="r") as file:
    # reading the CSV file
    csvFile = csv.reader(file)

    # displaying the contents of the CSV file
    for lines in csvFile:
        l.append(lines[1])

print(l)

with open("citydata.json", mode="w") as file:
    json.dump(l, file)
