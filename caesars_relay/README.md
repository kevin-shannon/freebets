# Freebets Caesars Relay

A Home Assistant OS app that fetches public Caesars odds through your home
connection for the collector running in AWS Lambda.

Version 0.3.0 can also receive fresh bet365 MO NBA responses from the normal
browser publisher, disabled by default. It reuses the existing tunnel and Access
application. Captures expire after 120 seconds by default; no stored odds survive
a restart. See the [publisher setup](../tools/bet365-devtools/README.md).

[Install and configure the app](DOCS.md).

[![Add repository to Home Assistant](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fkevin-shannon%2Ffreebets)
