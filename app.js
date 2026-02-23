const statusEl = document.getElementById('status');
const channelListEl = document.getElementById('channelList');
const searchInput = document.getElementById('searchInput');
const footballOnlyInput = document.getElementById('footballOnly');
const playerEl = document.getElementById('player');
const nowPlayingEl = document.getElementById('nowPlaying');
const fileInput = document.getElementById('playlistFile');
const loadSampleBtn = document.getElementById('loadSample');
const worldwideListEl = document.getElementById('worldwideList');

let channels = [];
let filteredChannels = [];
let selectedUrl = null;
let hls = null;


const worldwidePlaylists = [
  { name: 'Global channels (mixed)', url: 'https://iptv-org.github.io/iptv/index.m3u', region: 'Worldwide' },
  { name: 'Africa', url: 'https://iptv-org.github.io/iptv/regions/afr.m3u', region: 'Region' },
  { name: 'Asia', url: 'https://iptv-org.github.io/iptv/regions/asia.m3u', region: 'Region' },
  { name: 'Europe', url: 'https://iptv-org.github.io/iptv/regions/eur.m3u', region: 'Region' },
  { name: 'North America', url: 'https://iptv-org.github.io/iptv/regions/nam.m3u', region: 'Region' },
  { name: 'South America', url: 'https://iptv-org.github.io/iptv/regions/sam.m3u', region: 'Region' },
  { name: 'United States', url: 'https://iptv-org.github.io/iptv/countries/us.m3u', region: 'Country' },
  { name: 'United Kingdom', url: 'https://iptv-org.github.io/iptv/countries/uk.m3u', region: 'Country' },
  { name: 'France', url: 'https://iptv-org.github.io/iptv/countries/fr.m3u', region: 'Country' },
  { name: 'Germany', url: 'https://iptv-org.github.io/iptv/countries/de.m3u', region: 'Country' },
  { name: 'India', url: 'https://iptv-org.github.io/iptv/countries/in.m3u', region: 'Country' },
  { name: 'Brazil', url: 'https://iptv-org.github.io/iptv/countries/br.m3u', region: 'Country' },
  { name: 'Iptv.ng', url: 'https://iptv.ng/', region: 'Provider' }
];



function renderWorldwidePlaylists() {
  if (!worldwideListEl) {
    return;
  }

  worldwideListEl.innerHTML = '';

  worldwidePlaylists.forEach((playlist) => {
    const li = document.createElement('li');

    const link = document.createElement('a');
    link.href = playlist.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = playlist.name;

    const label = document.createElement('small');
    label.textContent = playlist.region;

    li.append(link, label);
    worldwideListEl.append(li);
  });
}

function parseAttributes(line) {
  const attrs = {};
  const regex = /([\w-]+)="([^"]*)"/g;
  let match;

  while ((match = regex.exec(line)) !== null) {
    attrs[match[1]] = match[2];
  }

  return attrs;
}

function parseM3U(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (!line.startsWith('#EXTINF')) {
      continue;
    }

    const attrs = parseAttributes(line);
    const name = line.includes(',') ? line.split(',').slice(1).join(',').trim() : 'Unknown';

    const url = lines[i + 1];
    if (!url || url.startsWith('#')) {
      continue;
    }

    if (!isLikelyStreamUrl(url)) {
      continue;
    }

    parsed.push({
      name,
      group: attrs['group-title'] || 'Other',
      logo: attrs['tvg-logo'] || '',
      url,
    });
  }

  return parsed;
}


function isLikelyStreamUrl(url) {
  return /^(https?:\/\/|rtsp:\/\/|rtmp:\/\/)/i.test(url);
}

function isFootballOrSports(channel) {
  const text = `${channel.name} ${channel.group}`.toLowerCase();
  return /(football|soccer|sports|sport|premier league|laliga|serie a|champions league)/.test(text);
}

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const footballOnly = footballOnlyInput.checked;

  filteredChannels = channels.filter((channel) => {
    const searchable = `${channel.name} ${channel.group}`.toLowerCase();
    const matchesQuery = !query || searchable.includes(query);
    const matchesFootball = !footballOnly || isFootballOrSports(channel);
    return matchesQuery && matchesFootball;
  });

  renderChannelList();

  statusEl.textContent = `Loaded ${channels.length} channels • Showing ${filteredChannels.length}`;
}

function selectChannel(channel) {
  selectedUrl = channel.url;
  nowPlayingEl.textContent = `Now playing: ${channel.name}`;

  if (hls) {
    hls.destroy();
    hls = null;
  }

  if (playerEl.canPlayType('application/vnd.apple.mpegurl')) {
    playerEl.src = channel.url;
  } else if (window.Hls && Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(playerEl);
  } else {
    playerEl.src = channel.url;
  }

  playerEl.play().catch(() => {
    statusEl.textContent = 'Autoplay blocked. Press play manually.';
  });

  renderChannelList();
}

function renderChannelList() {
  channelListEl.innerHTML = '';

  if (!filteredChannels.length) {
    const li = document.createElement('li');
    li.textContent = 'No channels match your filter.';
    channelListEl.append(li);
    return;
  }

  filteredChannels.forEach((channel) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.className = `channel${selectedUrl === channel.url ? ' active' : ''}`;
    button.textContent = channel.name;

    const groupLabel = document.createElement('small');
    groupLabel.textContent = channel.group;
    button.append(groupLabel);

    button.addEventListener('click', () => selectChannel(channel));
    li.append(button);
    channelListEl.append(li);
  });
}

async function loadBundledPlaylist() {
  try {
    const response = await fetch('./Lucifertv.m3u');
    const text = await response.text();
    channels = parseM3U(text);
    applyFilters();
    if (filteredChannels.length) {
      selectChannel(filteredChannels[0]);
    }
  } catch {
    statusEl.textContent = 'Failed to load bundled playlist.';
  }
}

fileInput.addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  const text = await file.text();
  channels = parseM3U(text);
  applyFilters();

  if (filteredChannels.length) {
    selectChannel(filteredChannels[0]);
  }
});

loadSampleBtn.addEventListener('click', loadBundledPlaylist);
searchInput.addEventListener('input', applyFilters);
footballOnlyInput.addEventListener('change', applyFilters);

renderWorldwidePlaylists();
renderChannelList();
