import re
import requests

from datetime import datetime
from utils import build_team_spread_market_name
from utils import construct_total_market_name
from utils import convert_team_event_name
from utils import standardize_team_name
from utils import standardize_team_spread


MONEYLINE = 'Moneyline'
TOTAL = 'Total Alternate'
SPREAD = 'Run Line Alternate'

def update_categories():
    categories = {'Game Lines': {'id': None, 'subcategories': {'Game': {'id': None}, 'Alternate Total': {'id': None}, 'Alternate Spread': {'id': None}}}}
    url = 'https://sportsbook.draftkings.com//sites/US-VA-SB/api/v5/eventgroups/42648?format=json'
    try:
        res = requests.get(url).json()
    except:
        print('error getting url')
    # Get category id's
    try:
        offer_categories = res['eventGroup']['offerCategories']
    except:
        print('error getting offer category')
    for offer_category in offer_categories:
        if offer_category['name'] in categories:
            try:
                categories[offer_category['name']]['id'] = offer_category['offerCategoryId']
            except:
                print('error getting category id')
    for category in categories.values():
        try:
            url = f'https://sportsbook.draftkings.com//sites/US-VA-SB/api/v5/eventgroups/42648/categories/{category["id"]}?format=json'
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

def generate_draftkings_nba_formatted_events():
    formatted_events = {}
    id_to_name = {}
    sport = 'nba'
    categories = update_categories()
    url = 'https://sportsbook.draftkings.com//sites/US-VA-SB/api/v5/eventgroups/42648?format=json'
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
        id_to_name[event_id] = event_name
        formatted_events[event_name] = {'offers': {}}
        try:
            formatted_events[event_name]['start'] = datetime.strptime(re.sub('\.\d*', '', event['startDate']), '%Y-%m-%dT%H:%M:%SZ')
        except ValueError:
            print('error parsing date time')
            formatted_events[event_name]['start'] = None
    for category in categories.values():
        for subcategory in category['subcategories'].values():
            try:
                url = f'https://sportsbook-us-va.draftkings.com//sites/US-VA-SB/api/v5/eventgroups/42648/categories/{category["id"]}/subcategories/{subcategory["id"]}?format=json'
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
                                    if label == MONEYLINE:
                                        try:
                                            outcomes = [{'name': standardize_team_name(outcome['label'], sport), 'odds': int(outcome['oddsAmerican'])} for outcome in option['outcomes']]
                                            event_name = id_to_name[option['eventId']]
                                            formatted_events[event_name]['offers']['Moneyline'] = outcomes
                                        except:
                                            print('something went wrong adding market moneyline')
                                    # Totals
                                    if label == TOTAL:
                                        try:
                                            event_name = id_to_name[option['eventId']]
                                        except:
                                            print('could not find event')
                                            continue
                                        try:
                                            for selection in option['outcomes']:
                                                line = selection['line']
                                                market_name = construct_total_market_name(line)
                                                outcome = {'name': selection['label'], 'odds': int(selection['oddsAmerican'])}
                                                if market_name in formatted_events[event_name]['offers']:
                                                    formatted_events[event_name]['offers'][market_name].append(outcome)
                                                else:
                                                    formatted_events[event_name]['offers'][market_name] = [outcome]
                                        except:
                                            print('something went wrong adding market total')
                                    # Speads
                                    if label == SPREAD:
                                        try:
                                            event_name = id_to_name[option['eventId']]
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
                                                if market_name in formatted_events[event_name]['offers']:
                                                    formatted_events[event_name]['offers'][market_name].append(outcome)
                                                else:
                                                    formatted_events[event_name]['offers'][market_name] = [outcome]
                                        except:
                                            print('something went wrong adding market spread')
    return formatted_events