def generate_event_name(team_a, team_b):
    team_a = convert_team_name_nhl(team_a)
    team_b = convert_team_name_nhl(team_b)
    return f'{team_a} vs {team_b}' if team_a < team_b else f'{team_b} vs {team_a}'

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
    a = a.strip('| ')
    b = b.strip('| ')
    return generate_event_name(a, b)

def convert_spread_nhl(spread, market_name=None):
    if market_name:
        team = convert_team_name_nhl(spread)
        line = float(market_name.split(' ')[-1])
        if team not in market_name:
            line = -line
    else:
        team, line = ' '.join(spread.split(' ')[:-1]), spread.split(' ')[-1]
    line = '+' + str(line) if float(line) > 0 else str(line)
    return f'{convert_team_name_nhl(team)} {line}'

def build_spread_market_name(teams, spread):
    team_a, team_b = teams
    team = ' '.join(spread.split(' ')[:-1])
    line = float(spread.split(' ')[-1])
    if line < 0:
        return construct_spread_market_name(convert_team_name_nhl(team), line)
    else:
        other_team = team_a if team == team_b else team_b
        return construct_spread_market_name(convert_team_name_nhl(other_team), -line)

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