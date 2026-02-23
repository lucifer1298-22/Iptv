# IPTV Player App

A lightweight web app to load IPTV (`.m3u/.m3u8`) playlists, browse live channels, and quickly filter football/sports streams.

## Features

- Load local M3U files
- Load bundled `Lucifertv.m3u`
- Search by channel/group name
- One-click "Football / Sports only" filter
- Built-in HLS playback via pinned `hls.js` version
- Curated list of free public IPTV playlists by world region/country
- Safer channel rendering (no HTML injection from playlist metadata)

## Run locally

```bash
python3 -m http.server 8080
```

Then open: `http://localhost:8080`
