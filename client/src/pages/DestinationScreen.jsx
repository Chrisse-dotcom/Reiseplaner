import { useState } from 'react';

const POPULAR_DESTINATIONS = [
  { name: 'Thailand', emoji: '🇹🇭' },
  { name: 'Japan', emoji: '🇯🇵' },
  { name: 'USA', emoji: '🇺🇸' },
  { name: 'Italien', emoji: '🇮🇹' },
  { name: 'Spanien', emoji: '🇪🇸' },
  { name: 'Griechenland', emoji: '🇬🇷' },
  { name: 'Türkei', emoji: '🇹🇷' },
  { name: 'Marokko', emoji: '🇲🇦' },
  { name: 'Mexiko', emoji: '🇲🇽' },
  { name: 'Australien', emoji: '🇦🇺' },
  { name: 'Portugal', emoji: '🇵🇹' },
  { name: 'Frankreich', emoji: '🇫🇷' },
  { name: 'Vietnam', emoji: '🇻🇳' },
  { name: 'Indonesien', emoji: '🇮🇩' },
  { name: 'Island', emoji: '🇮🇸' },
  { name: 'Kroatien', emoji: '🇭🇷' },
  { name: 'Peru', emoji: '🇵🇪' },
  { name: 'Kanada', emoji: '🇨🇦' },
  { name: 'Ägypten', emoji: '🇪🇬' },
  { name: 'Indien', emoji: '🇮🇳' },
];

export default function DestinationScreen({ onBack, onCreate }) {
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = country.length >= 1
    ? POPULAR_DESTINATIONS.filter((d) =>
        d.name.toLowerCase().includes(country.toLowerCase())
      )
    : [];

  const handleCreate = async () => {
    const finalCountry = country.trim();
    if (!finalCountry) return;
    // destination = city if given, otherwise = country (fallback for geo pin)
    const finalDestination = city.trim() || finalCountry;
    setLoading(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: finalDestination,
          country: finalCountry,
          start_date: startDate || null,
          end_date: endDate || null,
        }),
      });
      const trip = await res.json();
      onCreate(trip.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="header">
        <button className="header-back" onClick={onBack}>←</button>
        <h2 style={{ flex: 1 }}>Neue Reise</h2>
      </div>

      <div className="page">
        {/* Country input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
            🌍 Land / Reiseziel
          </label>
          <input
            className="input"
            style={{ borderRadius: filtered.length > 0 ? '8px 8px 0 0' : 8 }}
            placeholder="z.B. Thailand, Japan, Italien..."
            value={country}
            onChange={(e) => { setCountry(e.target.value); setCity(''); }}
            autoFocus
          />
          {filtered.length > 0 && (
            <div className="suggestion-list">
              {filtered.map((d) => (
                <div
                  key={d.name}
                  className="suggestion-item"
                  onClick={() => {
                    setCountry(d.name);
                  }}
                >
                  {d.emoji} {d.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* City / Region input – shown once a country is entered */}
        {country.trim().length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
              📍 Stadt oder Region <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <input
              className="input"
              placeholder={`z.B. Bangkok, Bali, Tokio...`}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6 }}>
              Für einen genauen Punkt auf dem Länderumriss im Dashboard
            </p>
          </div>
        )}

        {/* Popular destinations */}
        {country.length === 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontWeight: 600, marginBottom: 12 }}>🌟 Beliebte Reiseziele</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {POPULAR_DESTINATIONS.slice(0, 12).map((d) => (
                <button
                  key={d.name}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 99,
                    border: '2px solid var(--border)',
                    background: 'white',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                  onClick={() => setCountry(d.name)}
                >
                  {d.emoji} {d.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Travel dates */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontWeight: 600, marginBottom: 12 }}>📅 Reisezeitraum (optional)</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, overflow: 'hidden' }}>
            <div style={{ minWidth: 0 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Von</label>
              <input
                type="date"
                className="input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Bis</label>
              <input
                type="date"
                className="input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Create button */}
        <button
          className="btn btn-primary btn-full"
          style={{ fontSize: '1.05rem', padding: 16, borderRadius: 14 }}
          disabled={!country.trim() || loading}
          onClick={handleCreate}
        >
          {loading ? '...' : `✈️ Reise nach ${city.trim() || country || '...'} erstellen`}
        </button>
      </div>
    </div>
  );
}
