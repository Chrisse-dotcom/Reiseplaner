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
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = destination.length >= 1
    ? POPULAR_DESTINATIONS.filter((d) =>
        d.name.toLowerCase().includes(destination.toLowerCase())
      )
    : [];

  const handleCreate = async (dest) => {
    const finalDest = dest || destination.trim();
    if (!finalDest) return;
    setLoading(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: finalDest,
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
        {/* Destination input */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
            📍 Wohin reist du?
          </label>
          <input
            className="input"
            style={{ borderRadius: filtered.length > 0 ? '8px 8px 0 0' : 8 }}
            placeholder="Reiseziel eingeben..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            autoFocus
          />
          {filtered.length > 0 && (
            <div className="suggestion-list">
              {filtered.map((d) => (
                <div
                  key={d.name}
                  className="suggestion-item"
                  onClick={() => {
                    setDestination(d.name);
                  }}
                >
                  {d.emoji} {d.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular destinations */}
        {destination.length === 0 && (
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
                  onClick={() => setDestination(d.name)}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Von</label>
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Bis</label>
              <input
                type="date"
                className="input"
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
          disabled={!destination.trim() || loading}
          onClick={() => handleCreate()}
        >
          {loading ? '...' : `✈️ Reise nach ${destination || '...'} erstellen`}
        </button>
      </div>
    </div>
  );
}
