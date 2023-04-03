import boto3
import json
from datetime import datetime
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

def make_market_simple(market):
    return market.split(':')[0]

def make_outcome_simple(market, outcome):
    if market == 'Moneyline':
        return outcome['name']
    elif market.startswith('Team Total:'):
        return f'{market.split(":")[1].strip()} {outcome["name"]} {market.split(":")[2].strip()}'
    elif market.startswith('Total:'):
        return f'{outcome["name"]} {market.split(":")[1].strip()}'
    elif market.startswith('Spread:'):
        return outcome['name']

def aggregate(data):
    bets = {}
    for book in data:
        for sport in data[book]:
            for event in data[book][sport]:
                start = data[book][sport][event]['start']
                start_string = datetime.strftime(start, '%Y-%m-%dT%H:%M:%SZ') if start is not None else ''
                for market in data[book][sport][event]['offers']:
                    key = frozenset([sport, event, market])
                    outcomes = data[book][sport][event]['offers'][market]
                    if key not in bets:
                        bets[key] = {'sport': sport, 'event': event, 'market': make_market_simple(market), 'start': start_string}
                        bets[key]['outcomes'] = [{'name': make_outcome_simple(market, outcome), 'books': {}} for outcome in outcomes]
                    for i in range(len(outcomes)):
                        for j in range(len(bets[key]['outcomes'])):
                            if bets[key]['outcomes'][j]['name'] == outcomes[i]['name']:
                                if outcomes[i]['odds'] in bets[key]['outcomes'][j]['books']:
                                    bets[key]['outcomes'][j]['books'][outcomes[i]['odds']].append(book)
                                else:
                                    bets[key]['outcomes'][j]['books'][outcomes[i]['odds']] = [book]
    return list(bets.values())

def lambda_handler(event, context):
    # Define the S3 bucket and key
    bucket_name = "stanleys-bucket"
    key = "output.json"
    body = json.dumps(aggregate(data))
    
    # Create an S3 client object
    s3 = boto3.client('s3')
    
    # Convert the JSON object to a string and save it to S3
    s3.put_object(Bucket=bucket_name, Key=key, Body=body, ACL='public-read')
    
    return "Output saved to S3"