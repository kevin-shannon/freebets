// CRA 5 watches public assets and reloads the page when they change. Feed JSON
// is polled by the app, so those writes must not restart the user's session.
process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "development";
require("react-scripts/config/env");

const configPath = require.resolve("react-scripts/config/webpackDevServer.config");
const createConfig = require(configPath);
const generatedFeeds = /[/\\]public[/\\](?:output\.json|scrape-status\.json|\.(?:output\.json|scrape-status\.json)\..*\.tmp)$/;

// CRA has no public dev-server override hook. Wrap its pinned config factory
// before start loads it; retain the rest of CRA's configuration and Fast Refresh.
require.cache[configPath].exports = (...args) => {
  const config = createConfig(...args);
  const watch = config.static.watch;
  const ignored = watch.ignored;
  watch.ignored = [...(Array.isArray(ignored) ? ignored : ignored ? [ignored] : []), generatedFeeds];
  return config;
};

require("react-scripts/scripts/start");
