const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { pool } = require('../db');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/travel-info', async (req, res) => {
  const { destination, country, forceRefresh } = req.body;

  if (!destination) {
    return res.status(400).json({ error: 'Destination required' });
  }

  const countryKey = country || '';

  // Return cached data unless forceRefresh is requested
  if (!forceRefresh) {
    try {
      const cached = await pool.query(
        'SELECT content, updated_at FROM travel_info_cache WHERE destination = $1 AND country = $2',
        [destination, countryKey]
      );
      if (cached.rows.length > 0) {
        return res.json({ info: cached.rows[0].content, cached: true, updatedAt: cached.rows[0].updated_at });
      }
    } catch (err) {
      console.error('Cache read error:', err);
    }
  }

  const prompt = `Du bist ein erfahrener Reiseexperte. Gib mir alle wichtigen Informationen für Touristen über das Reiseziel: ${destination}${country ? `, ${country}` : ''}.

Strukturiere deine Antwort in folgende Abschnitte mit Emojis:

💰 **Währung & Zahlung**
Welche Währung wird verwendet, typische Zahlungsmethoden (Karte/Bar), aktuelle Wechselkurs-Hinweise.

🤝 **Trinkgeld**
Ist Trinkgeld üblich? Wie viel Prozent ist angemessen? In welchen Situationen gibt man Trinkgeld?

⚠️ **Reisewarnungen & Sicherheit**
Aktuelle Sicherheitslage, Gebiete die gemieden werden sollten, typische Gefahren für Touristen.

🌤️ **Klima & beste Reisezeit**
Typisches Wetter, beste Reisemonate, was sollte man bezüglich Klima beachten.

🤝 **Umgang mit Einheimischen & Kultur**
Kulturelle Besonderheiten, Verhaltensregeln, Tabus, Dresscode, religiöse Gepflogenheiten.

🍽️ **Essen & Trinken**
Typische Gerichte, Trinkwasserqualität, Besonderheiten beim Essen, was man unbedingt probieren sollte.

📋 **Einreise & Dokumente**
Visumspflicht, Passanforderungen, Impfpflichten oder -empfehlungen.

🚗 **Transport & Mobilität**
Wie kommt man am besten voran? Öffentliche Verkehrsmittel, Taxi, Mietwagen, Besonderheiten.

📱 **Praktische Tipps**
Steckdosentyp, Sprache, Nützliche Apps, SIM-Karte, Notfallnummern.

Antworte auf Deutsch und sei konkret und praxisnah.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0].text;

    // Save to cache
    try {
      await pool.query(
        `INSERT INTO travel_info_cache (destination, country, content, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (destination, country)
         DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
        [destination, countryKey, content]
      );
    } catch (err) {
      console.error('Cache write error:', err);
    }

    res.json({ info: content, cached: false, updatedAt: new Date() });
  } catch (err) {
    console.error('Anthropic API error:', err);
    res.status(500).json({ error: 'Fehler beim Abrufen der Reiseinformationen: ' + err.message });
  }
});

// ── Country outline via Nominatim ───────────────────────────────────────────

function geojsonToSVGPath(geojson, width = 400, height = 300, padding = 15) {
  let rings = [];
  if (geojson.type === 'Polygon') {
    rings = geojson.coordinates;
  } else if (geojson.type === 'MultiPolygon') {
    geojson.coordinates.forEach((poly) => rings.push(...poly));
  }
  if (rings.length === 0) return null;

  const allCoords = rings.flat();
  const lons = allCoords.map((c) => c[0]);
  const lats = allCoords.map((c) => c[1]);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const lonRange = maxLon - minLon || 1;
  const latRange = maxLat - minLat || 1;

  const availW = width - padding * 2;
  const availH = height - padding * 2;
  const scale = Math.min(availW / lonRange, availH / latRange);
  const offsetX = padding + (availW - lonRange * scale) / 2;
  const offsetY = padding + (availH - latRange * scale) / 2;

  const project = ([lon, lat]) => [
    offsetX + (lon - minLon) * scale,
    offsetY + (maxLat - lat) * scale,
  ];

  const pathData = rings
    .map((ring) =>
      ring.map((coord, i) => {
        const [x, y] = project(coord);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join('') + 'Z'
    )
    .join(' ');

  return { pathData, project };
}

router.get('/country-outline', async (req, res) => {
  const { destination, country } = req.query;
  if (!destination) return res.json(null);

  const cacheKey = `${destination}|${country || ''}`.toLowerCase();

  try {
    const cached = await pool.query('SELECT * FROM geo_cache WHERE cache_key = $1', [cacheKey]);
    if (cached.rows.length > 0) {
      const r = cached.rows[0];
      return res.json({ svgPath: r.svg_path, viewBox: r.view_box, destX: r.dest_x, destY: r.dest_y });
    }
  } catch (err) {
    console.error('Geo cache read error:', err);
  }

  try {
    const headers = { 'User-Agent': 'Reiseplaner/1.0 travel-planning-app' };

    // 1. Destination coordinates
    const destRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination + (country ? ', ' + country : ''))}&format=json&limit=1`,
      { headers }
    );
    const destData = await destRes.json();
    if (!destData.length) return res.json(null);
    const destLon = parseFloat(destData[0].lon);
    const destLat = parseFloat(destData[0].lat);

    // small delay to respect Nominatim rate limit (1 req/s)
    await new Promise((r) => setTimeout(r, 350));

    // 2. Country polygon
    const countryRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(country || destination)}&featuretype=country&format=json&polygon_geojson=1&polygon_threshold=0.01&limit=1`,
      { headers }
    );
    const countryData = await countryRes.json();
    if (!countryData.length || !countryData[0].geojson) return res.json(null);

    const result = geojsonToSVGPath(countryData[0].geojson, 400, 300);
    if (!result) return res.json(null);

    const [destX, destY] = result.project([destLon, destLat]);
    const data = { svgPath: result.pathData, viewBox: '0 0 400 300', destX, destY };

    try {
      await pool.query(
        `INSERT INTO geo_cache (cache_key, svg_path, view_box, dest_x, dest_y)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (cache_key) DO UPDATE
         SET svg_path=EXCLUDED.svg_path, view_box=EXCLUDED.view_box,
             dest_x=EXCLUDED.dest_x, dest_y=EXCLUDED.dest_y`,
        [cacheKey, data.svgPath, data.viewBox, data.destX, data.destY]
      );
    } catch (err) {
      console.error('Geo cache write error:', err);
    }

    res.json(data);
  } catch (err) {
    console.error('Country outline error:', err);
    res.json(null);
  }
});

router.post('/medicine-suggestions', async (req, res) => {
  const { destination, country } = req.body;
  if (!destination) return res.status(400).json({ error: 'Destination required' });

  const prompt = `Du bist ein erfahrener Reisemediziner. Erstelle eine kompakte Packliste für die Reiseapotheke für eine Reise nach ${destination}${country ? `, ${country}` : ''}.

Antworte NUR mit einer JSON-Liste von Strings, ohne Erklärungen, ohne Markdown-Blöcke, nur reines JSON-Array.
Gib 15-25 konkrete Einträge zurück, passend für das Reiseland (z.B. Malariaprophylaxe nur wenn relevant, Sonnenschutz bei Tropenreisen etc.).

Beispiel-Format:
["Schmerzmittel (Ibuprofen/Paracetamol)", "Pflaster-Sortiment", "Desinfektionsmittel"]

Berücksichtige typische Risiken des Reiselands: Klima, häufige Erkrankungen, Hygieneverhältnisse, verfügbare medizinische Versorgung vor Ort.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.trim();
    const items = JSON.parse(raw);
    res.json({ items });
  } catch (err) {
    console.error('Medicine suggestions error:', err);
    res.status(500).json({ error: 'Fehler beim Abrufen der Empfehlungen: ' + err.message });
  }
});

// ── Flight status & lookup via AeroDataBox (RapidAPI) ────────────────────────
// Set AERODATABOX_API_KEY in Railway env vars (free tier at rapidapi.com/aedbx/api/aerodatabox)

async function fetchViaAeroDataBox(flightNumber, date) {
  const key = process.env.AERODATABOX_API_KEY;
  const iata = flightNumber.trim().replace(/\s+/g, '');
  // Date defaults to today if not provided
  const d = date || new Date().toISOString().slice(0, 10);
  const url = `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(iata)}/${d}`;
  console.log('[AeroDataBox] GET', url);
  const resp = await fetch(url, {
    headers: {
      'X-RapidAPI-Key':  key,
      'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
    },
  });
  const text = await resp.text();
  console.log('[AeroDataBox] status:', resp.status, 'body:', text.slice(0, 500));
  if (resp.status === 404) return null; // flight not found
  if (!resp.ok) throw new Error(`AeroDataBox HTTP ${resp.status}: ${text.slice(0, 200)}`);
  const json = JSON.parse(text);
  const flight = Array.isArray(json) ? json[0] : json;
  if (!flight) return null;

  const dep = flight.departure || {};
  const arr = flight.arrival   || {};

  // scheduled local time: "2024-03-15 10:00+01:00" → "10:00"
  const localTime = (obj) => {
    const t = obj.scheduledTime?.local || obj.actualTime?.local || null;
    return t ? t.slice(11, 16) : null;
  };

  // map status string to our format
  const rawStatus = (flight.status || '').toLowerCase();
  let status = 'unknown';
  if (rawStatus.includes('cancel'))   status = 'cancelled';
  else if (rawStatus.includes('land') || rawStatus.includes('arriv')) status = 'on_time';
  else if (rawStatus.includes('delay')) status = 'delayed';
  else if (rawStatus.includes('active') || rawStatus.includes('en route')) status = 'on_time';
  else if (rawStatus.includes('schedul') || rawStatus.includes('expected')) status = 'on_time';

  const depDelay = dep.delay ?? 0;
  if (depDelay >= 5) status = 'delayed';

  return {
    // lookup fields
    airline:           flight.airline?.name   || null,
    departure_airport: dep.airport?.iata      || null,
    arrival_airport:   arr.airport?.iata      || null,
    departure_time:    localTime(dep),
    arrival_time:      localTime(arr),
    gate:              dep.gate               || null,
    terminal:          dep.terminal           || null,
    // status fields
    status,
    delay_minutes:     depDelay >= 5 ? depDelay : null,
    actual_departure:  dep.actualTime?.local?.slice(11, 16) || null,
    actual_arrival:    arr.actualTime?.local?.slice(11, 16) || null,
    note:              flight.status || null,
    checked_at:        new Date().toISOString(),
    source:            'aerodatabox',
  };
}

async function fetchStatusViaClaudeSearch(flightNumber, date) {
  const prompt = `Suche den aktuellen Live-Status für Flug ${flightNumber.trim()}${date ? ' am ' + date : ' heute'}.
Antworte NUR mit einem JSON-Objekt (kein Markdown, keine Erklärung):
{"status":"on_time|delayed|cancelled|unknown","delay_minutes":null,"actual_departure":null,"actual_arrival":null,"gate":null,"terminal":null,"note":null}
Werte: status = on_time / delayed / cancelled / unknown. delay_minutes = Verspätung in Minuten (Zahl oder null). actual_departure/actual_arrival = tatsächliche Zeiten HH:MM oder null. gate/terminal = aktuelle Werte oder null. note = kurzer Hinweis auf Deutsch oder null. null für unbekannte Felder.`;

  const tools = [{ type: 'web_search_20260209', name: 'web_search' }];
  let messages = [{ role: 'user', content: prompt }];
  let response = await client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 1024, tools, messages });
  let continuations = 0;
  while (response.stop_reason === 'pause_turn' && continuations < 3) {
    continuations++;
    messages = [{ role: 'user', content: prompt }, { role: 'assistant', content: response.content }];
    response = await client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 1024, tools, messages });
  }
  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const match = text.match(/\{[\s\S]*?\}/);
  if (!match) return null;
  const data = JSON.parse(match[0]);
  data.checked_at = new Date().toISOString();
  data.source = 'websearch';
  return data;
}

router.post('/flight-status', async (req, res) => {
  const { flightNumber, date } = req.body;
  if (!flightNumber) return res.status(400).json({ error: 'Flugnummer erforderlich' });

  try {
    let result = null;
    if (process.env.AERODATABOX_API_KEY) {
      try {
        result = await fetchViaAeroDataBox(flightNumber, date);
      } catch (apiErr) {
        console.warn('AeroDataBox status failed, falling back to web search:', apiErr.message);
      }
    }
    if (!result) {
      result = await fetchStatusViaClaudeSearch(flightNumber, date);
    }
    if (!result) return res.status(422).json({ error: 'Kein Flugstatus gefunden' });
    res.json(result);
  } catch (err) {
    console.error('Flight status error:', err);
    res.status(500).json({ error: 'Statusabfrage fehlgeschlagen: ' + err.message });
  }
});

// ── Flight lookup ─────────────────────────────────────────────────────────────

async function fetchLookupViaClaudeSearch(flightNumber, date) {
  const prompt = `Suche aktuelle Flugdaten für Flug ${flightNumber.trim()}${date ? ' am ' + date : ''}.
Antworte NUR mit einem JSON-Objekt (kein Markdown, keine Erklärung darum):
{"airline":"Name der Fluggesellschaft","departure_airport":"IATA","arrival_airport":"IATA","departure_time":"HH:MM","arrival_time":"HH:MM","gate":null,"terminal":null}
IATA = 3 Großbuchstaben. null für unbekannte Felder.`;
  const tools = [{ type: 'web_search_20260209', name: 'web_search' }];
  let messages = [{ role: 'user', content: prompt }];
  let response = await client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 1024, tools, messages });
  let continuations = 0;
  while (response.stop_reason === 'pause_turn' && continuations < 3) {
    continuations++;
    messages = [{ role: 'user', content: prompt }, { role: 'assistant', content: response.content }];
    response = await client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 1024, tools, messages });
  }
  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const match = text.match(/\{[\s\S]*?\}/);
  if (!match) return null;
  const data = JSON.parse(match[0]);
  data.source = 'websearch';
  return data;
}

router.post('/flight-lookup', async (req, res) => {
  const { flightNumber, date } = req.body;
  if (!flightNumber) return res.status(400).json({ error: 'Flugnummer erforderlich' });

  try {
    let result = null;
    if (process.env.AERODATABOX_API_KEY) {
      try {
        result = await fetchViaAeroDataBox(flightNumber, date);
      } catch (apiErr) {
        console.warn('AeroDataBox lookup failed, falling back to web search:', apiErr.message);
      }
    }
    if (!result) {
      result = await fetchLookupViaClaudeSearch(flightNumber, date);
    }
    if (!result) return res.status(422).json({ error: 'Keine Flugdaten gefunden' });
    res.json(result);
  } catch (err) {
    console.error('Flight lookup error:', err);
    res.status(500).json({ error: 'Suche fehlgeschlagen: ' + err.message });
  }
});

// ── AeroDataBox diagnostics ───────────────────────────────────────────────────
// GET /api/aerodatabox-test?flight=LH765&date=2026-03-10

router.get('/aerodatabox-test', async (req, res) => {
  const key = process.env.AERODATABOX_API_KEY;
  if (!key) {
    return res.json({ ok: false, reason: 'AERODATABOX_API_KEY ist nicht gesetzt (Railway → Variables)' });
  }
  const flight = (req.query.flight || 'LH1').replace(/\s+/g, '');
  const d = req.query.date || new Date().toISOString().slice(0, 10);
  const url = `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(flight)}/${d}`;
  try {
    const resp = await fetch(url, {
      headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com' },
    });
    const text = await resp.text();
    if (!resp.ok) return res.json({ ok: false, reason: `HTTP ${resp.status}`, body: text.slice(0, 300) });
    return res.json({ ok: true, result: JSON.parse(text) });
  } catch (err) {
    return res.json({ ok: false, reason: 'Netzwerkfehler: ' + err.message });
  }
});

// ── Live Wechselkurse ──────────────────────────────────────────────────────────
// GET /api/currency-rates?base=THB
// Uses fawazahmed0 free currency API (170+ currencies, no API key)

router.get('/currency-rates', async (req, res) => {
  const { base } = req.query;
  if (!base) return res.status(400).json({ error: 'base currency required' });

  const code = base.toLowerCase();
  const urls = [
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${code}.json`,
    `https://latest.currency-api.pages.dev/v1/currencies/${code}.json`,
  ];

  let lastErr;
  for (const url of urls) {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const rates = data[code];
      if (!rates) throw new Error('Leere Antwort der Währungs-API');
      return res.json({
        base: base.toUpperCase(),
        date: data.date,
        rates: {
          EUR: rates['eur'] ?? null,
          USD: rates['usd'] ?? null,
        },
      });
    } catch (err) {
      lastErr = err;
    }
  }
  console.error('currency-rates error:', lastErr?.message);
  res.status(502).json({ error: 'Wechselkurs nicht abrufbar: ' + (lastErr?.message || 'Unbekannter Fehler') });
});

module.exports = router;
