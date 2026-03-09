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

// ── Flight status (live) ─────────────────────────────────────────────────────
// Uses AviationStack API if AVIATIONSTACK_API_KEY is set, otherwise Claude web search

function toHHMM(isoString) {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    return d.toTimeString().slice(0, 5);
  } catch (_) { return null; }
}

async function fetchStatusViaAviationStack(flightNumber, date) {
  const key = process.env.AVIATIONSTACK_API_KEY;
  const params = new URLSearchParams({ access_key: key, flight_iata: flightNumber.trim() });
  if (date) params.append('flight_date', date);
  const url = `http://api.aviationstack.com/v1/flights?${params}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`AviationStack HTTP ${resp.status}`);
  const json = await resp.json();
  if (json.error) throw new Error(json.error.info || 'AviationStack Fehler');
  const flight = (json.data || [])[0];
  if (!flight) return null;

  const rawStatus = flight.flight_status; // scheduled|active|landed|cancelled|incident|diverted
  const depDelay = flight.departure?.delay || 0;
  let status;
  if (rawStatus === 'cancelled') status = 'cancelled';
  else if (rawStatus === 'landed' || rawStatus === 'active' || rawStatus === 'scheduled') {
    status = depDelay >= 5 ? 'delayed' : 'on_time';
  } else {
    status = 'unknown';
  }

  const noteMap = { landed: 'Gelandet', active: 'Im Flug', scheduled: 'Planmäßig', diverted: 'Umgeleitet', incident: 'Vorfall gemeldet' };

  return {
    status,
    delay_minutes: depDelay >= 5 ? depDelay : null,
    actual_departure: toHHMM(flight.departure?.actual || flight.departure?.estimated),
    actual_arrival: toHHMM(flight.arrival?.actual || flight.arrival?.estimated),
    gate: flight.departure?.gate || null,
    terminal: flight.departure?.terminal || null,
    note: noteMap[rawStatus] || null,
    checked_at: new Date().toISOString(),
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
  return data;
}

router.post('/flight-status', async (req, res) => {
  const { flightNumber, date } = req.body;
  if (!flightNumber) return res.status(400).json({ error: 'Flugnummer erforderlich' });

  try {
    let result = null;
    if (process.env.AVIATIONSTACK_API_KEY) {
      result = await fetchStatusViaAviationStack(flightNumber, date);
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

// ── Flight lookup via web search ────────────────────────────────────────────

router.post('/flight-lookup', async (req, res) => {
  const { flightNumber, date } = req.body;
  if (!flightNumber) return res.status(400).json({ error: 'Flugnummer erforderlich' });

  const prompt = `Suche aktuelle Flugdaten für Flug ${flightNumber.trim()}${date ? ' am ' + date : ''}.
Antworte NUR mit einem JSON-Objekt (kein Markdown, keine Erklärung darum):
{"airline":"Name der Fluggesellschaft","departure_airport":"IATA","arrival_airport":"IATA","departure_time":"HH:MM","arrival_time":"HH:MM","gate":null,"terminal":null}
IATA = 3 Großbuchstaben. null für unbekannte Felder.`;

  const tools = [{ type: 'web_search_20260209', name: 'web_search' }];
  let messages = [{ role: 'user', content: prompt }];

  try {
    let response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      tools,
      messages,
    });

    // Server-side tool hit iteration limit → re-send to continue (max 3x)
    let continuations = 0;
    while (response.stop_reason === 'pause_turn' && continuations < 3) {
      continuations++;
      messages = [
        { role: 'user', content: prompt },
        { role: 'assistant', content: response.content },
      ];
      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        tools,
        messages,
      });
    }

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    const match = text.match(/\{[\s\S]*?\}/);
    if (match) {
      try {
        return res.json(JSON.parse(match[0]));
      } catch (_) { /* invalid JSON, fall through */ }
    }

    res.status(422).json({ error: 'Keine Flugdaten gefunden' });
  } catch (err) {
    console.error('Flight lookup error:', err);
    res.status(500).json({ error: 'Suche fehlgeschlagen: ' + err.message });
  }
});

module.exports = router;
