import requests
from utils import convert_event_name_nhl, convert_market_name, convert_team_name_nhl

def generate_fanduel():
    return {
        'nhl': generate_fanduel_nhl_formatted_events()
    }

# FANDUEL
# NHL
def generate_fanduel_nhl_formatted_events():
    url = 'https://sbapi.nj.sportsbook.fanduel.com/api/content-managed-page?page=CUSTOM&customPageId=nhl&_ak=FhMFpcPWXMeyZxOx'
    res = requests.get(url).json()
    competitionId = [id for id, comp in res['attachments']['competitions'].items() if comp['name'] == 'NHL Games']
    competitionId = 12550521 if not competitionId else int(competitionId[0])
    event_ids = [event for event, info in res['attachments']['events'].items() if info['competitionId'] == competitionId]
    formatted_events = {convert_event_name_nhl(info['name']): {} for info in res['attachments']['events'].values() if info['competitionId'] == competitionId}
    id_to_tuple = {event_id: convert_event_name_nhl(info['name']) for event_id, info in res['attachments']['events'].items() if info['competitionId'] == competitionId}
    for event_id in event_ids:
        url = f'https://sbapi.nj.sportsbook.fanduel.com/api/event-page?_ak=FhMFpcPWXMeyZxOx&eventId={event_id}'
        res = requests.get(url).json()
        for selection in res['attachments']['markets'].values():
            # Moneyline
            if selection['marketType'] == 'MONEY_LINE':
                event_name = id_to_tuple[str(selection['eventId'])]
                market = convert_market_name(selection['marketType'])
                formatted_events[event_name][market] = [{'name': convert_team_name_nhl(outcome['runnerName']), 'odds': int(outcome['winRunnerOdds']['americanDisplayOdds']['americanOdds'])} for outcome in selection['runners']]
            # Totals
            if selection['marketType'] == 'TOTAL_POINTS_(OVER/UNDER)':
                pass
    return formatted_events
    
    