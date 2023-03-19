function aggregate(data, books_a, books_b) {
    bets = {}
    // First pass for book A
    for (let book in data) {
        if (books_a.includes(book)) {
            for (let sport in data[book]) {
                for (let event in data[book][sport]) {
                    for (let market in data[book][sport][event]) {
                        let key = sport + event + market;
                        let bi = (data[book][sport][event][market][0]['odds'] > data[book][sport][event][market][1]['odds']) ? 0 : 1
                        if (bets.hasOwnProperty(key)) {
                            let found = false;
                            for (let i = 0; i < bets[key]['outcomes'].length; i++) {
                                if (bets[key]['outcomes'][i]['name'] === data[book][sport][event][market][bi]['name']) {
                                    found = true;
                                    if (bets[key]['outcomes'][i]['odds'] < data[book][sport][event][market][bi]['odds']) {
                                        bets[key]['outcomes'][i]['odds'] = data[book][sport][event][market][bi]['odds'];
                                        bets[key]['outcomes'][i]['books'] = [book];
                                    } else if (bets[key]['outcomes'][i]['odds'] === data[book][sport][event][market][bi]['odds']) {
                                        bets[key]['outcomes'][i]['books'].push(book);
                                    }
                                }
                            }
                            if (!found) {
                                bets[key]['outcomes'].push(Object.assign({}, data[book][sport][event][market][bi], {books: [book]}));
                            }
                        } else {
                            bets[key] = {sport: sport, event: event, market: market, outcomes: [Object.assign({}, data[book][sport][event][market][bi], {books: [book]})]};
                        }
                    }
                }
            }
        }
    }
    // Second pass for book B
    for (let book in data) {
        if (books_b.includes(book)) {
            for (let sport in data[book]) {
                for (let event in data[book][sport]) {
                    for (let market in data[book][sport][event]) {
                        let key = sport + event + market;
                        let si = (data[book][sport][event][market][0]['odds'] > data[book][sport][event][market][1]['odds']) ? 1 : 0
                        let found = false;
                        if (!bets.hasOwnProperty(key)){
                            continue;
                        }
                        for (let i = 0; i < bets[key]['outcomes'].length; i++) {
                            if (bets[key]['outcomes'][i]['name'] === data[book][sport][event][market][si]['name']) {
                                found = true;
                                if (bets[key]['outcomes'][i]['odds'] < data[book][sport][event][market][si]['odds']) {
                                    bets[key]['outcomes'][i]['odds'] = data[book][sport][event][market][si]['odds'];
                                    bets[key]['outcomes'][i]['books'] = [book];
                                } else if (bets[key]['outcomes'][i]['odds'] === data[book][sport][event][market][si]['odds']) {
                                    bets[key]['outcomes'][i]['books'].push(book);
                                }
                            }
                        }
                        if (!found) {
                            bets[key]['outcomes'].push(Object.assign({}, data[book][sport][event][market][si], {books: [book]}));
                        }
                    }
                }
            }
        }
    }
    // Remove bets with one outcome
    for (let key in bets) { 
        if (bets[key]['outcomes'].length === 1) {
            delete bets.key
        }
    }
    return bets;
}