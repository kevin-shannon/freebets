from config import team_sports

def convert_decimal_to_american(dec):
    '''
    Converts decimal odds notation to American odds notation.
    Parameters
    ----------
    dec : float
        decimal odds to be converted.
    Returns
    -------
    int
        converted American odds.
    '''
    if dec < 2:
        return int(100/(1-dec))
    else:
        return int((dec-1)*100)

def generate_team_event_name(team_a, team_b, sport):
    '''
    Standarizes event names before generating an event name in the form of 'team_1 vs team_2', 
    where team_1 is lexographically less than team_2.
    Parameters
    ----------
    team_a : str
        the first team.
    team_b : str
        the second team.
    sport : str
        name of sport.
    Returns
    -------
    str
        standardized 'team_1 vs team_2'.
    '''
    team_a = standardize_team_name(team_a, sport)
    team_b = standardize_team_name(team_b, sport)
    return f'{team_a} vs {team_b}' if team_a < team_b else f'{team_b} vs {team_a}'

def convert_team_event_name(name, sport):
    '''
    Converts site specific representation of event name to standardized format.
    Parameters
    ----------
    name : str
        site specific representation of event name.
    sport : str
        name of sport.    
    Returns
    -------
    str
        standardized event name.
    '''
    separators = ['@', 'at', 'vs', 'vs.', 'versus']
    for separator in separators:
        if separator in name:
            team_a, team_b = name.split(f' {separator} ')
            return generate_team_event_name(team_a, team_b, sport)
    raise Exception(f'Could not parse team event name {name} for sport {sport}')

def standardize_team_spread(spread, sport):
    '''
    Standardizes team name in spread string. 
    Parameters
    ----------
    spread : str
        site specific representation of spread e.g. 'Chicago Bulls +1.5'
    sport : str
        name of sport.
    Returns
    -------
    str
        standardized spread representation.
    '''
    team, line = ' '.join(spread.split(' ')[:-1]), spread.split(' ')[-1]
    line = '+' + str(float(line)) if float(line) > 0 else str(line)
    return f'{standardize_team_name(team, sport)} {line}'

def construct_team_spread_from_market_name(team, market_name, sport):
    '''
    Constructs standardized spread from team and market name.
    Parameters
    ----------
    spread : str
        site specific representation of spread e.g. 'Chicago Bulls +1.5'
    market_name : str
        standardized spread market name.
    sport : str
        name of sport.
    Returns
    -------
    str
        standardized spread representation.
    '''
    team = standardize_team_name(team, sport)
    market_team, market_line = market_name.split(': ')[1:]
    if team != market_team:
        line = -float(market_line)
    else:
        line = float(market_line)
    line = '+' + str(line) if line > 0 else str(line)
    return f'{standardize_team_name(team, sport)} {line}'

def build_team_spread_market_name(teams, spread, sport):
    '''
    Builds a market name from a list of teams and a spread. The market name will always
    choose the negative line.
    Parameters
    ----------
    teams : list of str
        list of unstandardized teams
    spread : str
        unstandardized spread name.
    sport : str
        name of sport.
    Returns
    -------
    str
        standardized spread market name.
    '''
    team_a = standardize_team_name(teams[0], sport)
    team_b = standardize_team_name(teams[1], sport)
    spread = standardize_team_spread(spread, sport)
    team = ' '.join(spread.split(' ')[:-1])
    line = float(spread.split(' ')[-1])
    if line < 0:
        return construct_spread_market_name(team, line, sport)
    else:
        other_team = team_a if team == team_b else team_b
        return construct_spread_market_name(other_team, -line, sport)

def construct_total_market_name(line):
    '''
    Constructs standardized total market name.
    Parameters
    ----------
    line : float
        total market line.
    Returns
    -------
    str
        standardized total market name.
    '''
    return f'Total: {line}'

def construct_team_total_market_name(team, line, sport):
    '''
    Constructs standardized team total market name.
    Parameters
    ----------
    team : str
        unstandardized team name
    line : float
        spread market line.
    sport : str
        name of sport.
    Returns
    -------
    str
        standardized total market name.
    '''
    return f'Team Total: {standardize_team_name(team, sport)}: {line}'

def construct_spread_market_name(team, line, sport):
    '''
    Constructs standardized spread market name.
    Parameters
    ----------
    team : str
        unstandardized team name
    line : float
        spread market line.
    sport : str
        name of sport.
    Returns
    -------
    str
        standardized spread market name.
    '''
    return f'Spread: {standardize_team_name(team, sport)}: {line}'

def standardize_team_name(team, sport):
    '''
    Standardizes team name for a given sport.
    Parameters
    ----------
    team : str
        unstandardized team name
    sport : str
        name of sport.
    Returns
    -------
    str
        standardized team name.
    '''
    teams = team_sports[sport]
    for known_team in teams:
        if ' '.join(known_team.split(' ')[1:]).lower() in team.lower():
            return known_team
    raise Exception(f"Could not standardize team {team}")

def standardize_over_under(outcome):
    '''
    Parameters
    ----------
    outcome : str
        site specific over/under outcome representation.
    Returns
    -------
    str
        'Over' or 'Under'
    '''
    if 'under' in outcome.lower():
        return 'Under'
    elif 'over' in outcome.lower():
        return 'Over'