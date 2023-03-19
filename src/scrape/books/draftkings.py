import requests
from utils import convert_team_name_nhl, convert_market_name, construct_team_total_market_name, generate_event_name

def generate_draftkings():
    return {
        'nhl': generate_draftkings_nhl_formatted_events()
    }

# DRAFTKINGS
# NHL
def generate_draftkings_nhl_formatted_events():
    url = 'https://sportsbook.draftkings.com//sites/US-NJ-SB/api/v5/eventgroups/42133?format=json'
    res = requests.get(url).json()
    id_to_tuple = {}
    formatted_events = {}
    for offers in res['eventGroup']['offerCategories'][0]['offerSubcategoryDescriptors'][0]['offerSubcategory']['offers']:
        for offer in offers:
            id = offer['eventId']
            if 'label' not in offer:
                continue
            market_name = convert_market_name(offer['label'])
            if market_name == 'Moneyline':
                outcomes = [{'name': convert_team_name_nhl(outcome['label']), 'odds': int(outcome['oddsAmerican'])} for outcome in offer['outcomes']]
                event_name = generate_event_name(outcomes[0]['name'], outcomes[1]['name'])
                id_to_tuple[id] = event_name
                formatted_events[event_name] = {market_name: outcomes}
    category_id = 1193
    for category in res['eventGroup']['offerCategories']:
        if category['name'] == 'Team Totals':
            category_id = category['offerCategoryId']
    url = f'https://sportsbook-us-va.draftkings.com//sites/US-VA-SB/api/v5/eventgroups/42133/categories/{category_id}?format=json'
    res = requests.get(url).json()
    for offerCategory in res['eventGroup']['offerCategories']:
        if offerCategory['name'] == 'Team Totals':
            for subcategory in offerCategory['offerSubcategoryDescriptors']:
                if subcategory['name'] == 'Team Total Goals':
                    for event in subcategory['offerSubcategory']['offers']:
                        for team in event:
                            event_name = id_to_tuple[team['eventId']]
                            label = team['label']
                            for outcome in team['outcomes']:
                                line = outcome['line']
                                market_name = construct_team_total_market_name(label.split(':')[0], line)
                                if market_name in formatted_events[event_name]:
                                    formatted_events[event_name][market_name].append({'name': outcome['label'], 'odds': int(outcome['oddsAmerican'])})
                                else:
                                    formatted_events[event_name][market_name] = [{'name': outcome['label'], 'odds': int(outcome['oddsAmerican'])}]
    return formatted_events