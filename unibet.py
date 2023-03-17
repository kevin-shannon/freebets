import requests
from utils import convert_event_name_nhl, convert_team_name_nhl, convert_market_name, construct_total_market_name, construct_spread_market_name, construct_team_total_market_name

# UNIBET
# NHL
def generate_unibet_nhl_formatted_events():
    url = 'https://eu-offering-api.kambicdn.com/offering/v2018/ubusva/listView/ice_hockey/nhl/all/all/matches.json?lang=en_US&market=US-VA&useCombined=true&useCombinedLive=true'
    res = requests.get(url).json()
    formatted_events = {}
    events = res['events']
    for event in events:
        event_tuple = convert_event_name_nhl(event['event']['name'])
        event_id = event['event']['id']
        formatted_events[event_tuple] = {}
        for offer in event['betOffers']:
            if offer['criterion']['label'] == 'Moneyline - Inc. OT and Shootout':
                formatted_events[event_tuple]['Moneyline'] = [{'name': convert_team_name_nhl(outcome['label']), 'odds': int(outcome['oddsAmerican'])} for outcome in offer['outcomes']]
        url = f'https://eu-offering-api.kambicdn.com/offering/v2018/ubusva/betoffer/event/{event_id}.json'
        res = requests.get(url).json()
        for offer in res['betOffers']:
            # Totals
            if offer['criterion']['label'] == 'Total Goals - Including Overtime and Penalty Shootout':
                market_name = construct_total_market_name(float(offer['outcomes'][0]['line'])/1000)
                formatted_events[event_tuple][market_name] = [{'name': outcome['label'], 'odds': int(outcome['oddsAmerican'])} for outcome in offer['outcomes']]
            # Spreads
            if offer['criterion']['label'] == 'Handicap - Including Overtime and Penalty Shootout':
                line = float(offer['outcomes'][0]['line'])/1000
                if line < 0:
                    team = offer['outcomes'][0]['label']
                else:
                    team = offer['outcomes'][1]['label']
                    line = -line
                market_name = construct_spread_market_name(team, line)
                formatted_events[event_tuple][market_name] = [{'name': convert_team_name_nhl(outcome['label']), 'odds': int(outcome['oddsAmerican'])} for outcome in offer['outcomes']]
            # Team Totals
            if 'Total Goals by' in offer['criterion']['label'] and 'Including Overtime and Penalty Shootout' in offer['criterion']['label']:
                team = convert_team_name_nhl(offer['criterion']['label'].replace('Total Goals by', '').replace('- Including Overtime and Penalty Shootout', ''))
                line = float(offer['outcomes'][0]['line'])/1000
                market_name = construct_team_total_market_name(team, line)
                formatted_events[event_tuple][market_name] = [{'name': outcome['label'], 'odds': int(outcome['oddsAmerican'])} for outcome in offer['outcomes']]
    return formatted_events