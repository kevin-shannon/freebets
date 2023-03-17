def convert_decimal_to_american(dec):
    if dec < 2:
        return int(100/(1-dec))
    else:
        return int((dec-1)*100)
    
def convert_american_to_decimal(american):
    if american > 0:
        return 1+american/100
    else:
        return 1-100/american

def compute_ev(odds_a, odds_b):
    a = convert_american_to_decimal(odds_a)
    b = convert_american_to_decimal(odds_b)
    if a > b:
        return a/(a/b+1)
    else:
        return b/(b/a+1)

def compute_conversion(odds_a, odds_b):
    a = convert_american_to_decimal(odds_a)
    b = convert_american_to_decimal(odds_b)
    if a > b:
        return (a-1) - (a-1)/b
    else:
        return (b-1) - (b-1)/a

def convert_market_name(name):
    name = name.replace('|', '').replace('Live', '').replace(' - Inc. OT and Shootout', '').strip()
    if name.lower() == 'money line' or name.lower() == 'moneyline' or name.lower() == 'money_line':
        return 'Moneyline'

def convert_outcome_name(name):
    name = name.replace('|', '').strip()
    if name.lower() == 'under':
        return 'Under'
    elif name.lower() == 'over':
        return 'Over'

def convert_event_name_nhl(name):
    if ' @ ' in name:
        a, b = name.split(' @ ')
    if ' at ' in name:
        a, b = name.split(' at ')
    if ' |at| ' in name:
        a, b = name.split(' |at| ')
    a = convert_team_name_nhl(a.strip('| '))
    b = convert_team_name_nhl(b.strip('| '))
    return frozenset([a,b])

def convert_spread_nhl(spread, market_name=None):
    if market_name:
        team = convert_team_name_nhl(spread)
        line = float(market_name.split(' ')[-1])
        if team not in market_name:
            line = -line
    else:
        team, line = ' '.join(spread.split(' ')[:-1]), spread.split(' ')[-1]
    return f'{convert_team_name_nhl(team)} {line}'

def construct_total_market_name(line):
    return f'Total: {line}'

def construct_spread_market_name(team, line):
    return f'Spread: {convert_team_name_nhl(team)}: {line}'

def construct_team_total_market_name(team, line):
    return f'Team Total: {convert_team_name_nhl(team)}: {line}'

def convert_team_name_nhl(team):
    if team == 'Anaheim Ducks' or 'Ducks' in team:
        return 'ANA Ducks'
    elif team == 'Arizona Coyotes' or 'Coyotes' in team:
        return 'ARI Coyotes'
    elif team == 'Boston Bruins' or 'Bruins' in team:
        return 'BOS Bruins'
    elif team == 'Buffalo Sabres' or 'Sabres' in team:
        return 'BUF Sabres'
    elif team == 'Carolina Hurricanes' or 'Hurricanes' in team:
        return 'CAR Hurricanes'
    elif team == 'Columbus Blue Jackets' or 'Blue Jackets' in team:
        return 'CBJ Blue Jackets'
    elif team == 'Calgary Flames' or 'Flames' in team:
        return 'CGY Flames'
    elif team == 'Chicago Blackhawks' or 'Blackhawks' in team:
        return 'CHI Blackhawks'
    elif team == 'Colorado Avalanche' or 'Avalanche' in team:
        return 'COL Avalanche'
    elif team == 'Dallas Stars' or 'Stars' in team:
        return 'DAL Stars'
    elif team == 'Detroit Red Wings' or 'Red Wings' in team:
        return 'DET Red Wings'
    elif team == 'Edmonton Oilers' or 'Oilers' in team:
        return 'EDM Oilers'
    elif team == 'Florida Panthers' or 'Panthers' in team:
        return 'FLA Panthers'
    elif team == 'Los Angeles Kings' or 'Kings' in team:
        return 'LA Kings'
    elif team == 'Minnesota Wild' or 'Wild' in team:
        return 'MIN Wild'
    elif team == 'Montreal Canadiens' or 'Canadiens' in team:
        return 'MTL Canadiens'
    elif team == 'New Jersey Devils' or 'Devils' in team:
        return 'NJ Devils'
    elif team == 'Nashville Predators' or 'Predators' in team:
        return 'NSH Predators'
    elif team == 'New York Islanders' or 'Islanders' in team:
        return 'NY Islanders'
    elif team == 'New York Rangers' or 'Rangers' in team:
        return 'NY Rangers'
    elif team == 'Ottawa Senators' or 'Senators' in team:
        return 'OTT Senators'
    elif team == 'Philadelphia Flyers' or 'Flyers' in team:
        return 'PHI Flyers'
    elif team == 'Pittsburgh Penguins' or 'Penguins' in team:
        return 'PIT Penguins'
    elif team == 'Seattle Kraken' or 'Kraken' in team:
        return 'SEA Kraken'
    elif team == 'San Jose Sharks' or 'Sharks' in team:
        return 'SJ Sharks'
    elif team == 'St. Louis Blues' or 'Blues' in team:
        return 'STL Blues'
    elif team == 'Tampa Bay Lightning' or 'Lightning' in team:
        return 'TB Lightning'
    elif team == 'Toronto Maple Leafs' or 'Maple Leafs' in team:
        return 'TOR Maple Leafs'
    elif team == 'Vancouver Canucks' or 'Canucks' in team:
        return 'VAN Canucks'
    elif team == 'Vegas Golden Knights' or 'Golden Knights' in team:
        return 'VGK Golden Knights'
    elif team == 'Washington Capitals' or 'Capitals' in team:
        return 'WAS Capitals'
    elif team == 'Winnipeg Jets' or 'Jets' in team:
        return 'WPG Jets'