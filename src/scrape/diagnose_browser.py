"""Check Caesars through a normal anonymous browser session; log no credentials."""
import json
import time
import uuid

from selenium import webdriver

from books.caesars.caesars import COMPETITIONS


options = webdriver.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.set_capability("goog:loggingPrefs", {"performance": "ALL"})

with webdriver.Chrome(options=options) as browser:
    browser.set_page_load_timeout(40)
    browser.set_script_timeout(30)
    browser.get("https://sportsbook.caesars.com/")
    time.sleep(8)
    print(json.dumps({"page": browser.current_url, "title": browser.title}), flush=True)
    # Observe the public site's own responses without reading its auth headers.
    for entry in browser.get_log("performance"):
        message = json.loads(entry["message"])["message"]
        if message["method"] != "Network.responseReceived":
            continue
        response = message["params"]["response"]
        if "americanwagering.com" in response["url"]:
            print(json.dumps({"siteRequest": response["url"].split("?")[0], "status": response["status"]}), flush=True)
    url = "https://api.americanwagering.com/regions/us/locations/nj/brands/czr/sb/v4/sports/basketball/schedule"
    url += "?competitionId=" + COMPETITIONS["nba"][1]
    result = browser.execute_async_script("""
        const done = arguments[arguments.length - 1];
        fetch(arguments[0], {headers: {
            'Content-Type': 'application/json', 'X-Platform-Type': 'W',
            'X-Platform': 'rn-web', 'X-App-Version': '10.7.7',
            'X-Unique-Device-Id': arguments[1]
        }}).then(async response => {
            const body = await response.text();
            done({status: response.status, contentType: response.headers.get('content-type'),
                  json: body.trim().startsWith('[')});
        }).catch(error => done({error: error.name}));
    """, url, str(uuid.uuid4()))
    print(json.dumps({"browserFetch": result}), flush=True)
