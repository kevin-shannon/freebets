from utils import compute_ev, compute_conversion
from src.books.draftkings import generate_draftkings_nhl_formatted_events
from src.books.betmgm import generate_betmgm_nhl_formatted_events
from src.books.fanduel import generate_fanduel_nhl_formatted_events
from src.books.ceasars import generate_ceasars_nhl_formatted_events
from src.books.unibet import generate_unibet_nhl_formatted_events
from src.books.pointsbet import generate_pointsbet_nhl_formatted_events
#from superbook import generate_superbook_nhl_formatted_events

class Bet():
    def __init__(self, event, market, outcome_1, books_1, odds_1, outcome_2, books_2, odds_2):
        self.event = event
        self.market = market
        self.outcome_1 = outcome_1
        self.books_1 = books_1
        self.odds_1 = odds_1
        self.outcome_2 = outcome_2
        self.books_2 = books_2
        self.odds_2 = odds_2
        self.ev = compute_ev(self.odds_1, self.odds_2)
        self.conversion = compute_conversion(self.odds_1, self.odds_2)
    def __repr__(self):
        return f'{self.event} {self.market}\n{self.outcome_1}\n\t{self.odds_1}\n\t{self.books_1}\n{self.outcome_2}\n\t{self.odds_2}\n\t{self.books_2}\nEV: {self.ev}\nConversion: {self.conversion}\n'
    
draftkings_events = generate_draftkings_nhl_formatted_events()
betmgm_events = generate_betmgm_nhl_formatted_events()
fanduel_events = generate_fanduel_nhl_formatted_events()
ceasars_events = generate_ceasars_nhl_formatted_events()
unibet_events = generate_unibet_nhl_formatted_events()
pointsbet_events = generate_pointsbet_nhl_formatted_events()

bets = []
all_bets = set(draftkings_events).update(betmgm_events).update(fanduel_events).update(ceasars_events).update(unibet_events).update(pointsbet_events)
for event, market in all_bets:
    best = {}
    sites = {}
    for site_name, site in [('draftkings', draftkings_events), ('betmgm', betmgm_events), ('fanduel', fanduel_events), ('ceasars', ceasars_events), ('unibet', unibet_events), ('pointsbet', pointsbet_events)]:
        if event not in site or market not in site[event]:
            continue
        for outcome in site[event][market]:
            if outcome['name'] not in best:
                best[outcome['name']] = outcome['odds']
                sites[outcome['name']] = [site_name]
            elif outcome['odds'] == best[outcome['name']]:
                sites[outcome['name']].append(site_name)
            elif outcome['odds'] > best[outcome['name']]:
                best[outcome['name']] = outcome['odds']
                sites[outcome['name']] = [site_name]
        bets.append(Bet(event, market, list(best)[0], sites[list(best)[0]], best[list(best)[0]], list(best)[1], sites[list(best)[1]], best[list(best)[1]]))

sorted(bets, key=lambda x: x.conversion)
