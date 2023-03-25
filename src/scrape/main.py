import json
from books.betmgm import generate_betmgm
from books.caesars import generate_caesars
from books.draftkings import generate_draftkings
from books.fanduel import generate_fanduel
from books.pointsbet import generate_pointsbet
from books.superbook import generate_superbook
from books.unibet import generate_unibet

output = 'output/output.json'
data = {
    'betmgm': generate_betmgm(),
    'caesars': generate_caesars(),
    'draftkings': generate_draftkings(),
    'fanduel': generate_fanduel(),
    'pointsbet': generate_pointsbet(),
    'superbook': generate_superbook(),
    'unibet': generate_unibet()
}

def aggregate(data):
    bets = {}
    for book in data:
        for sport in data[book]:
            for event in data[book][sport]:
                for market in data[book][sport][event]:
                    key = frozenset([sport, event, market])
                    outcomes = data[book][sport][event][market]
                    if key not in bets:
                        bets[key] = {'sport': sport, 'event': event, 'market': market}
                        bets[key]['outcomes'] = [{'name': outcome['name'], 'books': {}} for outcome in outcomes]
                    for i in range(len(outcomes)):
                        for j in range(len(bets[key]['outcomes'])):
                            if bets[key]['outcomes'][j]['name'] == outcomes[i]['name']:
                                if outcomes[i]['odds'] in bets[key]['outcomes'][j]['books']:
                                    bets[key]['outcomes'][j]['books'][outcomes[i]['odds']].append(book)
                                else:
                                    bets[key]['outcomes'][j]['books'][outcomes[i]['odds']] = [book]
    return list(bets.values())

with open(output, "w") as f:
    json.dump(aggregate(data), f)
