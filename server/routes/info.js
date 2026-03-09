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

module.exports = router;
