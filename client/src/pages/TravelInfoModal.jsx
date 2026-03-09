import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function TravelInfoModal({ trip, onClose }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/travel-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: trip.destination, country: trip.country }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInfo(data.info);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '88vh', overflowY: 'auto', paddingBottom: 48 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>🌍 Reiseinfos</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: '1.4rem' }}>×</button>
        </div>

        <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.95rem' }}>
          Alle wichtigen Infos für deine Reise nach <strong>{trip.destination}</strong>
        </p>

        {!info && !loading && (
          <button
            className="btn btn-primary btn-full"
            style={{ marginBottom: 16 }}
            onClick={fetchInfo}
          >
            🤖 Infos von KI abrufen
          </button>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div className="spinner" />
            <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Reiseinformationen werden geladen...
            </p>
          </div>
        )}

        {error && (
          <div className="alert alert-warning">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {info && (
          <>
            <button
              className="btn btn-outline btn-sm"
              style={{ marginBottom: 16 }}
              onClick={fetchInfo}
            >
              🔄 Aktualisieren
            </button>
            <div className="markdown">
              <ReactMarkdown>{info}</ReactMarkdown>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
