import { useState, useEffect } from 'react';

const API = '/api/trips';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDay(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Returns 'current' | 'upcoming' | 'past' | 'undated'
function tripStatus(trip) {
  const now   = today();
  const start = parseDay(trip.start_date);
  const end   = parseDay(trip.end_date);

  if (!start && !end)          return 'undated';
  const effectiveEnd = end || start;
  if (effectiveEnd < now)      return 'past';
  if (start && start <= now)   return 'current';
  return 'upcoming';
}

function daysUntil(dateStr) {
  const start = parseDay(dateStr);
  if (!start) return null;
  return Math.round((start - today()) / 86400000);
}

function sortTrips(trips) {
  const order = { current: 0, upcoming: 1, undated: 2, past: 3 };
  return [...trips].sort((a, b) => {
    const sa = tripStatus(a);
    const sb = tripStatus(b);
    if (order[sa] !== order[sb]) return order[sa] - order[sb];

    if (sa === 'current') {
      // soonest ending first
      const ea = parseDay(a.end_date)?.getTime() ?? Infinity;
      const eb = parseDay(b.end_date)?.getTime() ?? Infinity;
      return ea - eb;
    }
    if (sa === 'upcoming') {
      // soonest starting first
      const da = parseDay(a.start_date)?.getTime() ?? Infinity;
      const db = parseDay(b.start_date)?.getTime() ?? Infinity;
      return da - db;
    }
    if (sa === 'past') {
      // most recent past first
      const ea = parseDay(a.end_date || a.start_date)?.getTime() ?? 0;
      const eb = parseDay(b.end_date || b.start_date)?.getTime() ?? 0;
      return eb - ea;
    }
    return 0;
  });
}

export default function StartScreen({ onSelectTrip, onNewTrip }) {
  const [trips,         setTrips]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((data) => setTrips(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const deleteTrip = async (tripId) => {
    await fetch(`${API}/${tripId}`, { method: 'DELETE' });
    setTrips(trips.filter((t) => t.id !== tripId));
    setDeleteConfirm(null);
  };

  const sorted = sortTrips(trips);

  return (
    <div className="app">
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%)',
        padding: '40px 24px 32px',
        color: 'white',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>✈️</div>
        <h1 style={{ color: 'white', marginBottom: 6 }}>Reiseplaner</h1>
        <p style={{ opacity: 0.85, fontSize: '1rem' }}>Dein persönlicher Reisebegleiter</p>
      </div>

      <div className="page" style={{ paddingTop: 24 }}>
        {/* New Trip Button */}
        <button
          className="btn btn-primary btn-full"
          style={{ fontSize: '1.05rem', padding: '16px', borderRadius: 14, marginBottom: 24 }}
          onClick={onNewTrip}
        >
          ＋ Neue Reise planen
        </button>

        <h3 style={{ marginBottom: 12, color: 'var(--text-muted)' }}>Gespeicherte Reisen</h3>

        {loading && <div className="spinner" style={{ marginTop: 32 }} />}

        {!loading && trips.length === 0 && (
          <div className="empty-state">
            <div className="emoji">🌍</div>
            <p>Noch keine gespeicherten Reisen.<br />Erstelle deine erste Reise!</p>
          </div>
        )}

        {sorted.map((trip) => {
          const status = tripStatus(trip);
          const isPast = status === 'past';
          const days   = status === 'upcoming' ? daysUntil(trip.start_date) : null;

          return (
            <div
              key={trip.id}
              className="card"
              style={{
                cursor: 'pointer',
                marginBottom: 10,
                opacity: isPast ? 0.55 : 1,
                transition: 'opacity 0.2s',
              }}
              onClick={() => onSelectTrip(trip.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.5rem' }}>📍</span>
                    <h3 style={{ margin: 0 }}>{trip.country || trip.destination}</h3>

                    {/* Status badges */}
                    {status === 'current' && (
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 700, borderRadius: 99,
                        padding: '2px 9px', background: '#dcfce7', color: '#166534',
                      }}>
                        🏝️ Läuft gerade
                      </span>
                    )}
                    {status === 'upcoming' && days != null && (
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 700, borderRadius: 99,
                        padding: '2px 9px',
                        background: days <= 7  ? '#fff7ed' : days <= 30 ? '#eff6ff' : '#f8fafc',
                        color:      days <= 7  ? '#9a3412' : days <= 30 ? '#1d4ed8' : '#475569',
                        border:     `1px solid ${days <= 7 ? '#fed7aa' : days <= 30 ? '#bfdbfe' : '#e2e8f0'}`,
                      }}>
                        {days === 0 ? '🚀 Heute!' : days === 1 ? '⏳ Morgen' : `⏳ Noch ${days} Tage`}
                      </span>
                    )}
                    {isPast && (
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 600, borderRadius: 99,
                        padding: '2px 9px', background: '#f1f5f9', color: '#94a3b8',
                      }}>
                        Vergangen
                      </span>
                    )}
                  </div>

                  {trip.destination && trip.destination !== trip.country && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 36, marginBottom: 2 }}>
                      {trip.destination}
                    </p>
                  )}
                  {(trip.start_date || trip.end_date) && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 36 }}>
                      {trip.start_date && formatDate(trip.start_date)}
                      {trip.start_date && trip.end_date && ' → '}
                      {trip.end_date && formatDate(trip.end_date)}
                    </p>
                  )}
                </div>

                <button
                  className="btn btn-ghost"
                  style={{ fontSize: '1.2rem', padding: '4px 8px' }}
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(trip.id); }}
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Reise löschen?</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20, textAlign: 'center', fontSize: '0.95rem' }}>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Checklisten werden ebenfalls gelöscht.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline btn-full" onClick={() => setDeleteConfirm(null)}>
                Abbrechen
              </button>
              <button className="btn btn-danger btn-full" onClick={() => deleteTrip(deleteConfirm)}>
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
