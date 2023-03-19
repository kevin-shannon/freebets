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

with open(output, "w") as f:
    json.dump(data, f)
