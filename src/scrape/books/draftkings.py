import re
import requests

from datetime import datetime
from utils import construct_team_total_market_name
from utils import convert_event_name_nhl
from utils import convert_team_name_nhl
from utils import generate_event_name


def generate_draftkings():
    return {
        'nhl': generate_draftkings_nhl_formatted_events()
    }

MONEYLINE = 'Moneyline'
TOTAL = ''
SPREAD = ''

def update_categories():
    categories = {'Game Lines': {'id': None, 'subcategories': {'Game': {'id': None}, 'Alt Total': {'id': None}, 'Alt Puck Line': {'id': None}}}, 'Team Totals': {'id': None, 'subcategories': {'Team Total Goals': {'id': None}}}}
    url = 'https://sportsbook.draftkings.com//sites/US-VA-SB/api/v5/eventgroups/42133?format=json'
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
            url = f'https://sportsbook.draftkings.com//sites/US-VA-SB/api/v5/eventgroups/42133/categories/{category["id"]}?format=json'
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

def seed_events(formatted_events, id_to_name):
    url = 'https://sportsbook.draftkings.com//sites/US-VA-SB/api/v5/eventgroups/42133?format=json'
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
            event_name = convert_event_name_nhl(event['name'])
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
        

# DRAFTKINGS
# NHL
def generate_draftkings_nhl_formatted_events():
    formatted_events = {}
    id_to_name = {}
    categories = update_categories()
    seed_events(formatted_events, id_to_name)

    for category_name, category in categories.items():
        for subcategory_name, subcategory in category['subcategories'].items():
            print(category_name, subcategory_name)
            try:
                url = f'https://sportsbook-us-va.draftkings.com//sites/US-VA-SB/api/v5/eventgroups/42133/categories/{category["id"]}/subcategories/{subcategory["id"]}?format=json'
                res = requests.get(url).json()
            except:
                print('error getting url')
                continue
            try:
                offer_categories = res['eventGroup']['offerCategories']
            except:
                print('error getting offer category')
            for offer_category in offer_categories:
                if offer_category['id'] == category['id']:
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
                                            outcomes = [{'name': convert_team_name_nhl(outcome['label']), 'odds': int(outcome['oddsAmerican'])} for outcome in option['outcomes']]
                                            event_name = id_to_name[option['eventId']]
                                            formatted_events[event_name]['offers']['Moneyline'] = outcomes
                                        except:
                                            print('something went wrong adding market moneyline')
                                    # Totals
                                    if label == TOTAL:
                                        pass
                                    # Speads
                                    if label == SPREAD:
                                        pass
                                    # Team Totals
                                    if 'Team Total Goals' in label:
                                        try:
                                            event_name = id_to_name[option['eventId']]
                                        except:
                                            print('could not find event')
                                            continue
                                        try:
                                            for outcome in option['outcomes']:
                                                line = outcome['line']
                                                market_name = construct_team_total_market_name(label.split(':')[0], line)
                                                if market_name in formatted_events[event_name]['offers']:
                                                    formatted_events[event_name]['offers'][market_name].append({'name': outcome['label'], 'odds': int(outcome['oddsAmerican'])})
                                                else:
                                                    formatted_events[event_name]['offers'][market_name] = [{'name': outcome['label'], 'odds': int(outcome['oddsAmerican'])}]
                                        except:
                                            print('something went wrong adding market team total')
    return formatted_events
