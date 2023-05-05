import re
import requests

from datetime import datetime
from utils import build_team_spread_market_name
from utils import construct_team_total_market_name
from utils import construct_total_market_name
from utils import convert_team_event_name
from utils import standardize_team_name
from utils import standardize_team_spread


nhl = {
    'sport': 'nhl',
    'sport_id': '42133',
    'market_labels': {"MONEYLINE": r'^Moneyline$', "TOTAL": r'^Alternate Total Goals$', "SPREAD": r'^Alternate Puck Line$', "TEAM_TOTAL": r'.*Team Total Goals$'},
    'categories': {'Game Lines': {'id': None, 'subcategories': {'Game': {'id': None}, 'Alt Total': {'id': None}, 'Alt Puck Line': {'id': None}}}, 'Team Totals': {'id': None, 'subcategories': {'Team Total Goals': {'id': None}}}}
}

mlb = {
    'sport': 'mlb',
    'sport_id': '84240',
    'market_labels': {"MONEYLINE": r'^Moneyline$', "TOTAL": r'^Total Alternate$', "SPREAD": r'^Run Line Alternate$'},
    'categories': {'Game Lines': {'id': None, 'subcategories': {'Game': {'id': None}, 'Alternate Total Runs': {'id': None}, 'Alternate Run Line': {'id': None}}}}
}

nba = {
    'sport': 'nba', 
    'sport_id': '42648', 
    'market_labels': {"MONEYLINE": r'^Moneyline$', "TOTAL": r'^Total Alternate$', "SPREAD": r'^Spread Alternate$'},
    'categories': {'Game Lines': {'id': None, 'subcategories': {'Game': {'id': None}, 'Alternate Total': {'id': None}, 'Alternate Spread': {'id': None}}}}
}

def generate_draftkings():
    return {
        'nhl': generate_draftkings_formatted_events(**nhl),
        'mlb': generate_draftkings_formatted_events(**mlb),
        'nba': generate_draftkings_formatted_events(**nba),
    }

def update_categories(sport_id, categories):
    url = f'https://sportsbook.draftkings.com//sites/US-VA-SB/api/v5/eventgroups/{sport_id}?format=json'
    try:
        res = requests.get(url).json()
    except:
        print('error getting url')
    # Get category id's
    try:
        offer_categories = res['eventGroup']['offerCategories']
    except:
        print('error getting offer category')
        return categories
    for offer_category in offer_categories:
        if offer_category['name'] in categories:
            try:
                categories[offer_category['name']]['id'] = offer_category['offerCategoryId']
            except:
                print('error getting category id')
    for category in categories.values():
        try:
            url = f'https://sportsbook.draftkings.com//sites/US-VA-SB/api/v5/eventgroups/{sport_id}/categories/{category["id"]}?format=json'
            res = requests.get(url).json()
        except:
            print('error getting url')
            continue
        try:
            offer_categories = res['eventGroup']['offerCategories']
        except:
            print('error getting offer category')
            continue
        for offer_category in offer_categories:
            if offer_category['name'] in categories:
                # Get subcategory id's
                try:
                    offer_subcategories = offer_category['offerSubcategoryDescriptors']
                except:
                    continue
                for offer_subcategory in offer_subcategories:
                    if offer_subcategory['name'] in categories[offer_category['name']]['subcategories']:
                        try:
                            categories[offer_category['name']]['subcategories'][offer_subcategory['name']]['id'] = offer_subcategory['subcategoryId']
                        except:
                            print('error getting subcategory id')
    return categories


def generate_draftkings_formatted_events(sport_id, sport, market_labels, categories):
    formatted_events = {}
    id_to_name_time = {}
    categories = update_categories(sport_id, categories)
    
    url = f'https://sportsbook.draftkings.com//sites/US-VA-SB/api/v5/eventgroups/{sport_id}?format=json'
    try:
        res = requests.get(url).json()
    except:
        print('error getting url')
        return
    try:
        events = res['eventGroup']['events']
    except:
        print('error getting events')
        return
    for event in events:
        try:
            event_name = convert_team_event_name(event['name'], sport)
            event_id = event['eventId']
        except:
            print('error parsing event info')
            continue
        try:
            start = datetime.strptime(re.sub('\.\d*', '', event['startDate']), '%Y-%m-%dT%H:%M:%SZ')
        except ValueError:
            print('error parsing date time')
            start = None
        id_to_name_time[event_id] = (event_name, start)
        if event_name not in formatted_events:
            formatted_events[event_name] = {}
        formatted_events[event_name][start] = {'offers': {}}

    for category in categories.values():
        for subcategory in category['subcategories'].values():
            try:
                url = f'https://sportsbook-us-va.draftkings.com//sites/US-VA-SB/api/v5/eventgroups/{sport_id}/categories/{category["id"]}/subcategories/{subcategory["id"]}?format=json'
                res = requests.get(url).json()
            except:
                print('error getting url')
                continue
            try:
                offer_categories = res['eventGroup']['offerCategories']
            except:
                print('error getting offer category')
            for offer_category in offer_categories:
                if offer_category['offerCategoryId'] == category['id']:
                    try:
                        offer_subcategories = offer_category['offerSubcategoryDescriptors']
                    except:
                        continue
                    for offer_subcategory in offer_subcategories:
                        if offer_subcategory['subcategoryId'] == subcategory['id']:
                            try:
                                offers = offer_subcategory['offerSubcategory']['offers']
                            except:
                                print('error getting offers')
                                continue
                            for offer in offers:
                                for option in offer:
                                    try:
                                        label = option['label']
                                    except:
                                        print('error getting label')
                                    # Moneyline
                                    if re.match(market_labels["MONEYLINE"], label):
                                        try:
                                            outcomes = [{'name': standardize_team_name(outcome['label'], sport), 'odds': int(outcome['oddsAmerican'])} for outcome in option['outcomes']]
                                            event_name, start = id_to_name_time[option['eventId']]
                                            formatted_events[event_name][start]['offers']['Moneyline'] = outcomes
                                        except:
                                            print('something went wrong adding market moneyline')
                                    # Totals
                                    if re.match(market_labels["TOTAL"], label):
                                        try:
                                            event_name, start = id_to_name_time[option['eventId']]
                                        except:
                                            print('could not find event')
                                            continue
                                        try:
                                            for selection in option['outcomes']:
                                                line = selection['line']
                                                market_name = construct_total_market_name(line)
                                                outcome = {'name': selection['label'], 'odds': int(selection['oddsAmerican'])}
                                                if market_name in formatted_events[event_name][start]['offers']:
                                                    formatted_events[event_name][start]['offers'][market_name].append(outcome)
                                                else:
                                                    formatted_events[event_name][start]['offers'][market_name] = [outcome]
                                        except:
                                            print('something went wrong adding market total')
                                    # Speads
                                    if re.match(market_labels["SPREAD"], label):
                                        try:
                                            event_name, start = id_to_name_time[option['eventId']]
                                        except:
                                            print('could not find event')
                                            continue
                                        try:
                                            for selection in option['outcomes']:
                                                line = selection['line']
                                                teams = event_name.split(' vs ')
                                                spread = f'{selection["label"]} {selection["line"]}'
                                                market_name = build_team_spread_market_name(teams, spread, sport)
                                                outcome = {'name': standardize_team_spread(spread, sport), 'odds': int(selection['oddsAmerican'])}
                                                if market_name in formatted_events[event_name][start]['offers']:
                                                    formatted_events[event_name][start]['offers'][market_name].append(outcome)
                                                else:
                                                    formatted_events[event_name][start]['offers'][market_name] = [outcome]
                                        except:
                                            print('something went wrong adding market spread')
                                    # Team Totals
                                    if "TEAM_TOTAL" in market_labels and re.match(market_labels["TEAM_TOTAL"], label):
                                        try:
                                            event_name, start = id_to_name_time[option['eventId']]
                                        except:
                                            print('could not find event')
                                            continue
                                        try:
                                            for selection in option['outcomes']:
                                                line = selection['line']
                                                market_name = construct_team_total_market_name(label.split(':')[0], line, sport)
                                                outcome = {'name': selection['label'], 'odds': int(selection['oddsAmerican'])}
                                                if market_name in formatted_events[event_name][start]['offers']:
                                                    formatted_events[event_name][start]['offers'][market_name].append(outcome)
                                                else:
                                                    formatted_events[event_name][start]['offers'][market_name] = [outcome]
                                        except:
                                            print('something went wrong adding market team total')
    return formatted_events