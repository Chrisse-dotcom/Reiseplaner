import { useState } from 'react';

function emptyFlight(label, date = '') {
  return { label, flight_number: '', departure_airport: '', arrival_airport: '', flight_date: date, departure_time: '', arrival_time: '', gate: '', terminal: '' };
}

const labelStyle = { display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 4 };
const inputStyle  = { padding: '8px 10px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' };

function FlightCard({ flight, index, total, onChange, onRemove, onLookup, lookingUp }) {
  const isFirst  = index === 0;
  const isLast   = index === total - 1;
  const canRemove = total > 2 && !isFirst && !isLast;
  const upd = (field, val) => onChange(index, field, val);

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, marginBottom: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e40af' }}>
          {isFirst ? '✈️ Hinflug' : isLast ? '🔄 Rückflug' : '🔀 Zwischenflug'}
        </span>
        {canRemove && (
          <button onClick={() => onRemove(index)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1.1rem', cursor: 'pointer', padding: '2px 6px' }}>×</button>
        )}
      </div>

      {/* Flight number + AI lookup button */}
      <div style={{ marginBottom: 8 }}>
        <label style={labelStyle}>Flugnummer</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            className="input"
            style={{ ...inputStyle, flex: 1 }}
            placeholder="z.B. LH 765"
            value={flight.flight_number}
            onChange={e => upd('flight_number', e.target.value)}
          />
          <button
            onClick={() => onLookup(index)}
            disabled={!flight.flight_number.trim() || lookingUp}
            title="Flugdaten automatisch per KI abrufen"
            style={{
              background: lookingUp
                ? '#e2e8f0'
                : 'linear-gradient(135deg, #1e40af, #3b82f6)',
              color: lookingUp ? '#94a3b8' : 'white',
              border: 'none',
              borderRadius: 8,
              padding: '0 14px',
              cursor: flight.flight_number.trim() && !lookingUp ? 'pointer' : 'not-allowed',
              fontSize: '1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              minWidth: 44,
              justifyContent: 'center',
            }}
          >
            {lookingUp
              ? <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #94a3b8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : '🔍'}
          </button>
        </div>
        {lookingUp && (
          <p style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: 4 }}>Flugdaten werden von AviationStack abgerufen…</p>
        )}
      </div>

      {/* Date */}
      <div style={{ marginBottom: 8 }}>
        <label style={labelStyle}>Datum</label>
        <div style={{ maxWidth: '60%' }}>
          <input className="input" style={inputStyle} type="date" value={flight.flight_date} onChange={e => upd('flight_date', e.target.value)} />
        </div>
      </div>

      {/* Airports */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 24px 1fr', gap: 6, alignItems: 'flex-end', marginBottom: 8, overflow: 'hidden' }}>
        <div>
          <label style={labelStyle}>Abflug (IATA)</label>
          <input className="input" style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}
            placeholder="MUC" maxLength={3}
            value={flight.departure_airport}
            onChange={e => upd('departure_airport', e.target.value.toUpperCase())} />
        </div>
        <div style={{ textAlign: 'center', paddingBottom: 8, color: '#94a3b8' }}>→</div>
        <div>
          <label style={labelStyle}>Ankunft (IATA)</label>
          <input className="input" style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}
            placeholder="BKK" maxLength={3}
            value={flight.arrival_airport}
            onChange={e => upd('arrival_airport', e.target.value.toUpperCase())} />
        </div>
      </div>

      {/* Times */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ width: '45%' }}>
          <label style={labelStyle}>Abflugzeit</label>
          <input className="input" style={inputStyle} type="time" value={flight.departure_time} onChange={e => upd('departure_time', e.target.value)} />
        </div>
        <div style={{ width: '45%' }}>
          <label style={labelStyle}>Ankunftzeit</label>
          <input className="input" style={inputStyle} type="time" value={flight.arrival_time} onChange={e => upd('arrival_time', e.target.value)} />
        </div>
      </div>

      {/* Gate + Terminal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>Gate <span style={{ color: '#94a3b8' }}>(optional)</span></label>
          <input className="input" style={inputStyle} placeholder="z.B. A22" value={flight.gate} onChange={e => upd('gate', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Terminal <span style={{ color: '#94a3b8' }}>(optional)</span></label>
          <input className="input" style={inputStyle} placeholder="z.B. T2" value={flight.terminal} onChange={e => upd('terminal', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

export default function FlightModal({ trip, onClose, onSaved }) {
  const existing = trip.flights || [];

  const [flights, setFlights] = useState(() => {
    if (existing.length > 0) {
      return existing.map(f => ({
        label:             f.label || 'Flug',
        flight_number:     f.flight_number     || '',
        departure_airport: f.departure_airport || '',
        arrival_airport:   f.arrival_airport   || '',
        flight_date:       f.flight_date       || '',
        departure_time:    f.departure_time    || '',
        arrival_time:      f.arrival_time      || '',
        gate:              f.gate              || '',
        terminal:          f.terminal          || '',
      }));
    }
    return [
      emptyFlight('Hinflug',  trip.start_date || ''),
      emptyFlight('Rückflug', trip.end_date   || ''),
    ];
  });

  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState(null);
  const [lookupLoading, setLookupLoading] = useState({}); // { [index]: bool }
  const [lookupSuccess, setLookupSuccess] = useState({}); // { [index]: bool }

  const updateFlight = (index, field, val) =>
    setFlights(fs => fs.map((f, i) => i === index ? { ...f, [field]: val } : f));

  const addConnection = () => {
    setFlights(fs => {
      const last = fs[fs.length - 1];
      const prev = fs[fs.length - 2];
      const conn = emptyFlight('Zwischenflug', '');
      conn.departure_airport = prev?.arrival_airport || '';
      return [...fs.slice(0, -1), conn, last];
    });
  };

  const removeFlight = (index) =>
    setFlights(fs => fs.filter((_, i) => i !== index));

  const handleLookup = async (index) => {
    const flight = flights[index];
    if (!flight.flight_number.trim()) return;

    setLookupLoading(prev => ({ ...prev, [index]: true }));
    setLookupSuccess(prev => ({ ...prev, [index]: false }));
    setError(null);

    try {
      const res = await fetch('/api/flight-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flightNumber: flight.flight_number, date: flight.flight_date }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setFlights(fs => fs.map((f, i) => i !== index ? f : {
        ...f,
        departure_airport: data.departure_airport || f.departure_airport,
        arrival_airport:   data.arrival_airport   || f.arrival_airport,
        departure_time:    data.departure_time     || f.departure_time,
        arrival_time:      data.arrival_time       || f.arrival_time,
        gate:              data.gate != null       ? (data.gate     || f.gate)     : f.gate,
        terminal:          data.terminal != null   ? (data.terminal || f.terminal) : f.terminal,
      }));
      setLookupSuccess(prev => ({ ...prev, [index]: true }));
      setTimeout(() => setLookupSuccess(prev => ({ ...prev, [index]: false })), 3000);
    } catch (err) {
      setError(`${flight.flight_number}: ${err.message}`);
    } finally {
      setLookupLoading(prev => ({ ...prev, [index]: false }));
    }
  };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2>✈️ Flugdaten</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: '1.4rem' }}>×</button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          Flugnummer eingeben und 🔍 drücken – die KI sucht alle Daten automatisch.
        </p>

        {flights.map((flight, i) => (
          <div key={i}>
            {lookupSuccess[i] && (
              <div style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 10, padding: '8px 12px', marginBottom: 8, fontSize: '0.82rem', color: '#065f46', display: 'flex', gap: 6 }}>
                ✅ Flugdaten für {flight.flight_number} erfolgreich geladen
              </div>
            )}
            <FlightCard
              index={i}
              total={flights.length}
              flight={flight}
              onChange={updateFlight}
              onRemove={removeFlight}
              onLookup={handleLookup}
              lookingUp={!!lookupLoading[i]}
            />
          </div>
        ))}

        <button
          onClick={addConnection}
          style={{ width: '100%', background: 'none', border: '2px dashed #cbd5e1', borderRadius: 12, padding: '12px', color: '#64748b', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}
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
          <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
            {saving ? '...' : '💾 Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
