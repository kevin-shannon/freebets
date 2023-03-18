import requests
from utils import convert_team_name_nhl, convert_market_name, construct_team_total_market_name, construct_total_market_name, construct_spread_market_name, convert_spread_nhl, convert_outcome_name

# BETMGM
# NHL
def generate_betmgm_nhl_formatted_events():
    url = 'https://sports.dc.betmgm.com/en/sports/api/widget?layoutSize=Large&page=CompetitionLobby&sportId=12&regionId=9&competitionId=34'
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'}
    xbwin_id = 'YTBiYWQ3ZjItMjBlZi00ODU2LWFmNjMtMTQzYjAzOGUxNDM2'
    res = requests.get(url, headers=headers).json()
    formatted_events = {}
    id_to_tuple = {}
    for event in res['widgets'][2]['payload']['items'][0]['activeChildren'][0]['payload']['fixtures']:
        event_tuple = frozenset(sorted([convert_team_name_nhl(event['participants'][0]['name']['value']), convert_team_name_nhl(event['participants'][1]['name']['value'])]))
        id_to_tuple[event['id']] = event_tuple
        for market in event['games']:
            market_name = convert_market_name(market['name']['value']) 
            if market_name == 'Moneyline':
                formatted_events[event_tuple] = {market_name: [{'name': convert_team_name_nhl(result['name']['value']), 'odds': int(result['americanOdds'])} for result in market['results']]}
    for fixtureId in id_to_tuple:
        url = f'https://sports.dc.betmgm.com/cds-api/bettingoffer/fixture-view?x-bwin-accessid={xbwin_id}&lang=en-us&country=US&offerMapping=All&scoreboardMode=Full&fixtureIds={fixtureId}'
        res = requests.get(url, headers=headers).json()
        event_tuple = id_to_tuple[fixtureId]
        for game in res['fixture']['games']:
            # Team Totals
            if 'How many goals will' in game['name']['value'] and '(including overtime and shoot-outs)' in game['name']['value']:
                team = game['name']['value'].replace('How many goals will the ', '').replace(' score? (including overtime and shoot-outs)', '')
                line =  game['attr']
                market_name = construct_team_total_market_name(team, line)
                formatted_events[event_tuple][market_name] = [{'name': convert_outcome_name(outcome['totalsPrefix']), 'odds': int(outcome['americanOdds'])} for outcome in game['results']]
            # Totals
            if game['name']['value'] == 'Totals (including overtime and shoot-outs)':
                line =  game['attr']
                market_name = construct_total_market_name(line)
                formatted_events[event_tuple][market_name] = [{'name': convert_outcome_name(outcome['totalsPrefix']), 'odds': int(outcome['americanOdds'])} for outcome in game['results']]
            # Spreads
            if game['name']['value'] == 'Spread (including overtime and shoot-outs)':
                line = float(game['results'][0]['name']['value'].split(' ')[-1])
                if line < 0:
                    team = ' '.join(game['results'][0]['name']['value'].split(' ')[:-1])
                else:
                    team = ' '.join(game['results'][1]['name']['value'].split(' ')[:-1])
                    line = -line
                market_name = construct_spread_market_name(team, line)
                formatted_events[event_tuple][market_name] = [{'name': convert_spread_nhl(outcome['name']['value']), 'odds': int(outcome['americanOdds'])} for outcome in game['results']]
    return formatted_events