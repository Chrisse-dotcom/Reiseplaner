import { useState } from 'react';

function emptyFlight(label, date = '') {
  return { label, flight_number: '', departure_airport: '', arrival_airport: '', flight_date: date, departure_time: '', arrival_time: '', gate: '', terminal: '' };
}

function FlightCard({ flight, index, total, onChange, onRemove }) {
  const isFirst = index === 0;
  const isLast  = index === total - 1;
  const canRemove = total > 2 && !isFirst && !isLast;

  const upd = (field, val) => onChange(index, field, val);

  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
    }}>
      {/* Card header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e40af' }}>
          {isFirst ? '✈️ Hinflug' : isLast ? '🔄 Rückflug' : `🔀 Zwischenflug`}
        </span>
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1.1rem', cursor: 'pointer', padding: '2px 6px' }}
          >×</button>
        )}
      </div>

      {/* Flight number + date */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <label style={labelStyle}>Flugnummer</label>
          <input className="input" style={inputStyle} placeholder="z.B. LH 765"
            value={flight.flight_number}
            onChange={e => upd('flight_number', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Datum</label>
          <input className="input" style={inputStyle} type="date"
            value={flight.flight_date}
            onChange={e => upd('flight_date', e.target.value)} />
        </div>
      </div>

      {/* Airports */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 24px 1fr', gap: 6, alignItems: 'flex-end', marginBottom: 8 }}>
        <div>
          <label style={labelStyle}>Abflug (IATA)</label>
          <input className="input" style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}
            placeholder="MUC" maxLength={3}
            value={flight.departure_airport}
            onChange={e => upd('departure_airport', e.target.value.toUpperCase())} />
        </div>
        <div style={{ textAlign: 'center', paddingBottom: 8, fontSize: '1rem', color: '#94a3b8' }}>→</div>
        <div>
          <label style={labelStyle}>Ankunft (IATA)</label>
          <input className="input" style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}
            placeholder="BKK" maxLength={3}
            value={flight.arrival_airport}
            onChange={e => upd('arrival_airport', e.target.value.toUpperCase())} />
        </div>
      </div>

      {/* Times */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <label style={labelStyle}>Abflugzeit</label>
          <input className="input" style={inputStyle} type="time"
            value={flight.departure_time}
            onChange={e => upd('departure_time', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Ankunftzeit</label>
          <input className="input" style={inputStyle} type="time"
            value={flight.arrival_time}
            onChange={e => upd('arrival_time', e.target.value)} />
        </div>
      </div>

      {/* Gate + Terminal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>Gate <span style={{ color: '#94a3b8' }}>(optional)</span></label>
          <input className="input" style={inputStyle} placeholder="z.B. A22"
            value={flight.gate}
            onChange={e => upd('gate', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Terminal <span style={{ color: '#94a3b8' }}>(optional)</span></label>
          <input className="input" style={inputStyle} placeholder="z.B. T2"
            value={flight.terminal}
            onChange={e => upd('terminal', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 4 };
const inputStyle  = { padding: '8px 10px', fontSize: '0.9rem' };

export default function FlightModal({ trip, onClose, onSaved }) {
  const existing = trip.flights || [];

  const [flights, setFlights] = useState(() => {
    if (existing.length > 0) {
      return existing.map(f => ({
        label:             f.label || 'Flug',
        flight_number:     f.flight_number || '',
        departure_airport: f.departure_airport || '',
        arrival_airport:   f.arrival_airport  || '',
        flight_date:       f.flight_date      || '',
        departure_time:    f.departure_time   || '',
        arrival_time:      f.arrival_time     || '',
        gate:              f.gate             || '',
        terminal:          f.terminal         || '',
      }));
    }
    return [
      emptyFlight('Hinflug',  trip.start_date || ''),
      emptyFlight('Rückflug', trip.end_date   || ''),
    ];
  });

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  const updateFlight = (index, field, val) =>
    setFlights(fs => fs.map((f, i) => i === index ? { ...f, [field]: val } : f));

  const addConnection = () => {
    setFlights(fs => {
      const last = fs[fs.length - 1];
      const prev = fs[fs.length - 2];
      const conn = emptyFlight('Zwischenflug', '');
      // pre-fill departure = previous arrival
      conn.departure_airport = prev?.arrival_airport || '';
      return [...fs.slice(0, -1), conn, last];
    });
  };

  const removeFlight = (index) =>
    setFlights(fs => fs.filter((_, i) => i !== index));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${trip.id}/flights`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flights }),
      });
      if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      const saved = await res.json();
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto', paddingBottom: 48 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>✈️ Flugdaten</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: '1.4rem' }}>×</button>
        </div>

        {flights.map((flight, i) => (
          <FlightCard
            key={i}
            index={i}
            total={flights.length}
            flight={flight}
            onChange={updateFlight}
            onRemove={removeFlight}
          />
        ))}

        {/* Add connection flight button */}
        <button
          onClick={addConnection}
          style={{
            width: '100%',
            background: 'none',
            border: '2px dashed #cbd5e1',
            borderRadius: 12,
            padding: '12px',
            color: '#64748b',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          ＋ Zwischenflug hinzufügen
        </button>

        {error && (
          <div className="alert alert-warning" style={{ marginBottom: 12 }}>
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline btn-full" onClick={onClose}>Abbrechen</button>
          <button
            className="btn btn-primary btn-full"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '...' : '💾 Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
