import { useState, useEffect } from 'react';

export default function CopyChecklistModal({ currentTripId, onClose, onCopied }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [copyTasks, setCopyTasks] = useState(true);
  const [copyPacking, setCopyPacking] = useState(true);
  const [copyMedicine, setCopyMedicine] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    fetch('/api/trips')
      .then((r) => r.json())
      .then((data) => setTrips(data.filter((t) => t.id !== currentTripId)))
      .finally(() => setLoading(false));
  }, [currentTripId]);

  const handleCopy = async () => {
    if (!selectedTrip) return;
    setCopying(true);
    try {
      await fetch(`/api/trips/${currentTripId}/copy-from/${selectedTrip}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copyTasks, copyPacking, copyMedicine }),
      });
      onCopied();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setCopying(false);
    }
  };

  const nothingSelected = !copyTasks && !copyPacking && !copyMedicine;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>📋 Checklisten kopieren</h3>
          <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: '1.4rem' }}>×</button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
          Kopiere Checklisten von einer anderen Reise in diese Reise.
        </p>

        {/* What to copy */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>Was kopieren?</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={copyTasks}
              onChange={(e) => setCopyTasks(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
            />
            <span>📋 Aufgaben-Checkliste</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={copyPacking}
              onChange={(e) => setCopyPacking(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
            />
            <span>🧳 Packliste</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={copyMedicine}
              onChange={(e) => setCopyMedicine(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: '#7e22ce' }}
            />
            <span>💊 Reiseapotheke</span>
          </label>
        </div>

        {/* Trip selection */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>Von welcher Reise?</p>
          {loading && <div className="spinner" />}
          {!loading && trips.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Keine anderen Reisen vorhanden.</p>
          )}
          {trips.map((trip) => (
            <label
              key={trip.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px',
                borderRadius: 8,
                border: `2px solid ${selectedTrip === trip.id ? 'var(--primary)' : 'var(--border)'}`,
                marginBottom: 8,
                cursor: 'pointer',
                background: selectedTrip === trip.id ? 'var(--primary-light)' : 'white',
              }}
            >
              <input
                type="radio"
                name="sourceTrip"
                value={trip.id}
                checked={selectedTrip === trip.id}
                onChange={() => setSelectedTrip(trip.id)}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span>📍 {trip.destination}</span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline btn-full" onClick={onClose}>
            Abbrechen
          </button>
          <button
            className="btn btn-primary btn-full"
            disabled={!selectedTrip || nothingSelected || copying}
            onClick={handleCopy}
          >
            {copying ? '...' : '📋 Kopieren'}
          </button>
        </div>
      </div>
    </div>
  );
}
