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

          let badge = null;
          if (status === 'current') {
            badge = (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: '0.78rem', fontWeight: 700, borderRadius: 99,
                padding: '5px 12px',
                background: 'linear-gradient(135deg, #bbf7d0, #86efac)',
                color: '#14532d',
                boxShadow: '0 1px 4px rgba(22,101,52,0.15)',
                letterSpacing: '0.01em',
              }}>
                <span style={{ fontSize: '0.9rem' }}>🏝️</span> Läuft gerade
              </span>
            );
          } else if (status === 'upcoming' && days != null) {
            const urgent = days <= 7;
            const soon   = days <= 30;
            badge = (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: '0.78rem', fontWeight: 700, borderRadius: 99,
                padding: '5px 12px',
                background: urgent ? 'linear-gradient(135deg, #fed7aa, #fb923c)'
                           : soon  ? 'linear-gradient(135deg, #bfdbfe, #60a5fa)'
                                   : 'linear-gradient(135deg, #e2e8f0, #cbd5e1)',
                color: urgent ? '#7c2d12' : soon ? '#1e3a8a' : '#475569',
                boxShadow: urgent ? '0 1px 4px rgba(234,88,12,0.2)'
                          : soon  ? '0 1px 4px rgba(37,99,235,0.15)'
                                  : '0 1px 3px rgba(0,0,0,0.08)',
                letterSpacing: '0.01em',
              }}>
                {days === 0 ? (
                  <><span>🚀</span> Heute!</>
                ) : days === 1 ? (
                  <><span>⏳</span> Morgen</>
                ) : (
                  <>
                    <span style={{
                      background: urgent ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.5)',
                      borderRadius: 99, padding: '1px 7px',
                      fontSize: '0.85rem', fontWeight: 800,
                    }}>{days}</span>
                    Tage
                  </>
                )}
              </span>
            );
          } else if (isPast) {
            badge = (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                fontSize: '0.75rem', fontWeight: 600, borderRadius: 99,
                padding: '4px 11px',
                background: '#f1f5f9', color: '#94a3b8',
                border: '1px solid #e2e8f0',
              }}>
                Vergangen
              </span>
            );
          }

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '1.5rem' }}>📍</span>
                    <h3 style={{ margin: 0 }}>{trip.country || trip.destination}</h3>
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
                  style={{ fontSize: '1.2rem', padding: '4px 8px', flexShrink: 0 }}
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(trip.id); }}
                >
                  🗑
                </button>
              </div>

              {badge && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  {badge}
                </div>
              )}
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
