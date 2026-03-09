import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function TravelInfoModal({ trip, onClose }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [isCached, setIsCached] = useState(false);

  const fetchInfo = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/travel-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: trip.destination, country: trip.country, forceRefresh }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInfo(data.info);
      setIsCached(data.cached);
      setUpdatedAt(data.updatedAt ? new Date(data.updatedAt) : null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo(false);
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

        {info && !loading && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              {updatedAt && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {isCached ? '💾 Gespeichert' : '✨ Neu abgerufen'}: {formatDate(updatedAt)}
                </span>
              )}
              <button
                className="btn btn-outline btn-sm"
                onClick={() => fetchInfo(true)}
              >
                🔄 Aktualisieren
              </button>
            </div>
            <div className="markdown">
              <ReactMarkdown>{info}</ReactMarkdown>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
