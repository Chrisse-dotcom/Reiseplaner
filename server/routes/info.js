const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/travel-info', async (req, res) => {
  const { destination, country } = req.body;

  if (!destination) {
    return res.status(400).json({ error: 'Destination required' });
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

    res.json({ info: message.content[0].text });
  } catch (err) {
    console.error('Anthropic API error:', err);
    res.status(500).json({ error: 'Fehler beim Abrufen der Reiseinformationen: ' + err.message });
  }
});

module.exports = router;
