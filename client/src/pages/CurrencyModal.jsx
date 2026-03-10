import { useState, useEffect } from 'react';

// Country → currency mapping (both English and German names)
const COUNTRY_CURRENCY = {
  // Popular travel destinations
  Thailand:                        { code: 'THB', name: 'Thaibaht',                   symbol: '฿' },
  Japan:                           { code: 'JPY', name: 'Japanischer Yen',             symbol: '¥' },
  USA:                             { code: 'USD', name: 'US-Dollar',                   symbol: '$' },
  'Vereinigte Staaten':            { code: 'USD', name: 'US-Dollar',                   symbol: '$' },
  Italy:                           { code: 'EUR', name: 'Euro',                        symbol: '€' },
  Italien:                         { code: 'EUR', name: 'Euro',                        symbol: '€' },
  Spain:                           { code: 'EUR', name: 'Euro',                        symbol: '€' },
  Spanien:                         { code: 'EUR', name: 'Euro',                        symbol: '€' },
  Greece:                          { code: 'EUR', name: 'Euro',                        symbol: '€' },
  Griechenland:                    { code: 'EUR', name: 'Euro',                        symbol: '€' },
  Turkey:                          { code: 'TRY', name: 'Türkische Lira',              symbol: '₺' },
  Türkei:                          { code: 'TRY', name: 'Türkische Lira',              symbol: '₺' },
  Morocco:                         { code: 'MAD', name: 'Marokkanischer Dirham',       symbol: 'MAD' },
  Marokko:                         { code: 'MAD', name: 'Marokkanischer Dirham',       symbol: 'MAD' },
  Mexico:                          { code: 'MXN', name: 'Mexikanischer Peso',          symbol: '$' },
  Mexiko:                          { code: 'MXN', name: 'Mexikanischer Peso',          symbol: '$' },
  Australia:                       { code: 'AUD', name: 'Australischer Dollar',        symbol: 'A$' },
  Australien:                      { code: 'AUD', name: 'Australischer Dollar',        symbol: 'A$' },
  Portugal:                        { code: 'EUR', name: 'Euro',                        symbol: '€' },
  France:                          { code: 'EUR', name: 'Euro',                        symbol: '€' },
  Frankreich:                      { code: 'EUR', name: 'Euro',                        symbol: '€' },
  Vietnam:                         { code: 'VND', name: 'Vietnamesischer Dong',        symbol: '₫' },
  Indonesia:                       { code: 'IDR', name: 'Indonesische Rupiah',         symbol: 'Rp' },
  Indonesien:                      { code: 'IDR', name: 'Indonesische Rupiah',         symbol: 'Rp' },
  Iceland:                         { code: 'ISK', name: 'Isländische Krone',           symbol: 'kr' },
  Island:                          { code: 'ISK', name: 'Isländische Krone',           symbol: 'kr' },
  Croatia:                         { code: 'EUR', name: 'Euro',                        symbol: '€' },
  Kroatien:                        { code: 'EUR', name: 'Euro',                        symbol: '€' },
  Peru:                            { code: 'PEN', name: 'Peruanischer Sol',            symbol: 'S/' },
  Canada:                          { code: 'CAD', name: 'Kanadischer Dollar',          symbol: 'CA$' },
  Kanada:                          { code: 'CAD', name: 'Kanadischer Dollar',          symbol: 'CA$' },
  Egypt:                           { code: 'EGP', name: 'Ägyptisches Pfund',           symbol: '£' },
  Ägypten:                         { code: 'EGP', name: 'Ägyptisches Pfund',           symbol: '£' },
  India:                           { code: 'INR', name: 'Indische Rupie',              symbol: '₹' },
  Indien:                          { code: 'INR', name: 'Indische Rupie',              symbol: '₹' },
  // Europe
  'United Kingdom':                { code: 'GBP', name: 'Britisches Pfund',            symbol: '£' },
  Großbritannien:                  { code: 'GBP', name: 'Britisches Pfund',            symbol: '£' },
  Switzerland:                     { code: 'CHF', name: 'Schweizer Franken',           symbol: 'CHF' },
  Schweiz:                         { code: 'CHF', name: 'Schweizer Franken',           symbol: 'CHF' },
  Norway:                          { code: 'NOK', name: 'Norwegische Krone',           symbol: 'kr' },
  Norwegen:                        { code: 'NOK', name: 'Norwegische Krone',           symbol: 'kr' },
  Sweden:                          { code: 'SEK', name: 'Schwedische Krone',           symbol: 'kr' },
  Schweden:                        { code: 'SEK', name: 'Schwedische Krone',           symbol: 'kr' },
  Denmark:                         { code: 'DKK', name: 'Dänische Krone',              symbol: 'kr' },
  Dänemark:                        { code: 'DKK', name: 'Dänische Krone',              symbol: 'kr' },
  'Czech Republic':                { code: 'CZK', name: 'Tschechische Krone',          symbol: 'Kč' },
  Tschechien:                      { code: 'CZK', name: 'Tschechische Krone',          symbol: 'Kč' },
  Poland:                          { code: 'PLN', name: 'Polnischer Zloty',            symbol: 'zł' },
  Polen:                           { code: 'PLN', name: 'Polnischer Zloty',            symbol: 'zł' },
  Hungary:                         { code: 'HUF', name: 'Ungarischer Forint',          symbol: 'Ft' },
  Ungarn:                          { code: 'HUF', name: 'Ungarischer Forint',          symbol: 'Ft' },
  Romania:                         { code: 'RON', name: 'Rumänischer Leu',             symbol: 'lei' },
  Rumänien:                        { code: 'RON', name: 'Rumänischer Leu',             symbol: 'lei' },
  Bulgaria:                        { code: 'BGN', name: 'Bulgarischer Lew',            symbol: 'лв' },
  Bulgarien:                       { code: 'BGN', name: 'Bulgarischer Lew',            symbol: 'лв' },
  Austria:                         { code: 'EUR', name: 'Euro',                        symbol: '€' },
  Österreich:                      { code: 'EUR', name: 'Euro',                        symbol: '€' },
  Germany:                         { code: 'EUR', name: 'Euro',                        symbol: '€' },
  Deutschland:                     { code: 'EUR', name: 'Euro',                        symbol: '€' },
  Netherlands:                     { code: 'EUR', name: 'Euro',                        symbol: '€' },
  Niederlande:                     { code: 'EUR', name: 'Euro',                        symbol: '€' },
  Belgium:                         { code: 'EUR', name: 'Euro',                        symbol: '€' },
  Belgien:                         { code: 'EUR', name: 'Euro',                        symbol: '€' },
  // Asia
  Singapore:                       { code: 'SGD', name: 'Singapur-Dollar',             symbol: 'S$' },
  Singapur:                        { code: 'SGD', name: 'Singapur-Dollar',             symbol: 'S$' },
  Malaysia:                        { code: 'MYR', name: 'Malaysischer Ringgit',        symbol: 'RM' },
  'South Korea':                   { code: 'KRW', name: 'Südkoreanischer Won',         symbol: '₩' },
  Südkorea:                        { code: 'KRW', name: 'Südkoreanischer Won',         symbol: '₩' },
  China:                           { code: 'CNY', name: 'Chinesischer Yuan',           symbol: '¥' },
  Philippines:                     { code: 'PHP', name: 'Philippinischer Peso',        symbol: '₱' },
  Philippinen:                     { code: 'PHP', name: 'Philippinischer Peso',        symbol: '₱' },
  'Sri Lanka':                     { code: 'LKR', name: 'Sri-Lankische Rupie',         symbol: 'Rs' },
  Cambodia:                        { code: 'KHR', name: 'Kambodschanischer Riel',      symbol: '៛' },
  Kambodscha:                      { code: 'KHR', name: 'Kambodschanischer Riel',      symbol: '៛' },
  Nepal:                           { code: 'NPR', name: 'Nepalesische Rupie',          symbol: 'Rs' },
  'Hong Kong':                     { code: 'HKD', name: 'Hongkong-Dollar',             symbol: 'HK$' },
  Hongkong:                        { code: 'HKD', name: 'Hongkong-Dollar',             symbol: 'HK$' },
  Taiwan:                          { code: 'TWD', name: 'Neuer Taiwan-Dollar',         symbol: 'NT$' },
  // Oceania
  'New Zealand':                   { code: 'NZD', name: 'Neuseeland-Dollar',           symbol: 'NZ$' },
  Neuseeland:                      { code: 'NZD', name: 'Neuseeland-Dollar',           symbol: 'NZ$' },
  // Americas
  Brazil:                          { code: 'BRL', name: 'Brasilianischer Real',        symbol: 'R$' },
  Brasilien:                       { code: 'BRL', name: 'Brasilianischer Real',        symbol: 'R$' },
  Argentina:                       { code: 'ARS', name: 'Argentinischer Peso',         symbol: '$' },
  Argentinien:                     { code: 'ARS', name: 'Argentinischer Peso',         symbol: '$' },
  Colombia:                        { code: 'COP', name: 'Kolumbianischer Peso',        symbol: '$' },
  Kolumbien:                       { code: 'COP', name: 'Kolumbianischer Peso',        symbol: '$' },
  Chile:                           { code: 'CLP', name: 'Chilenischer Peso',           symbol: '$' },
  'Dominican Republic':            { code: 'DOP', name: 'Dominikanischer Peso',        symbol: 'RD$' },
  'Dominikanische Republik':       { code: 'DOP', name: 'Dominikanischer Peso',        symbol: 'RD$' },
  Cuba:                            { code: 'CUP', name: 'Kubanischer Peso',            symbol: '$' },
  Kuba:                            { code: 'CUP', name: 'Kubanischer Peso',            symbol: '$' },
  // Middle East & Africa
  UAE:                             { code: 'AED', name: 'VAE-Dirham',                  symbol: 'د.إ' },
  'Vereinigte Arabische Emirate':  { code: 'AED', name: 'VAE-Dirham',                  symbol: 'د.إ' },
  Dubai:                           { code: 'AED', name: 'VAE-Dirham',                  symbol: 'د.إ' },
  Israel:                          { code: 'ILS', name: 'Israelischer Neuer Schekel',  symbol: '₪' },
  Jordan:                          { code: 'JOD', name: 'Jordanischer Dinar',          symbol: 'JD' },
  Jordanien:                       { code: 'JOD', name: 'Jordanischer Dinar',          symbol: 'JD' },
  'South Africa':                  { code: 'ZAR', name: 'Südafrikanischer Rand',       symbol: 'R' },
  Südafrika:                       { code: 'ZAR', name: 'Südafrikanischer Rand',       symbol: 'R' },
  Kenya:                           { code: 'KES', name: 'Kenianischer Schilling',      symbol: 'KSh' },
  Kenia:                           { code: 'KES', name: 'Kenianischer Schilling',      symbol: 'KSh' },
  Tanzania:                        { code: 'TZS', name: 'Tansanischer Schilling',      symbol: 'TSh' },
  Tansania:                        { code: 'TZS', name: 'Tansanischer Schilling',      symbol: 'TSh' },
};

// Currencies where 0 decimal places make more sense for display
const NO_DECIMALS = new Set(['JPY', 'KRW', 'IDR', 'VND', 'KHR', 'CLP', 'HUF', 'ISK', 'COP', 'TZS', 'UGX']);

function fmtNum(n, code) {
  if (n == null || isNaN(n)) return '—';
  const decimals = NO_DECIMALS.has(code) ? 0 : 2;
  return n.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

const QUICK_AMOUNTS_LOCAL  = [10, 50, 100, 500, 1000, 5000];
const QUICK_AMOUNTS_FOREIGN = [1, 5, 10, 20, 50, 100];

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 14px', fontSize: '1.3rem', fontWeight: 700,
  border: '2px solid #e2e8f0', borderRadius: 12, outline: 'none',
  textAlign: 'right', letterSpacing: '0.02em',
};

const tabBtn = (active) => ({
  flex: 1, padding: '8px 4px', fontSize: '0.78rem', fontWeight: 600,
  border: 'none', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
  background: active ? '#0f172a' : '#f1f5f9',
  color: active ? 'white' : '#64748b',
});

export default function CurrencyModal({ trip, onClose }) {
  const detected = COUNTRY_CURRENCY[trip.country] || COUNTRY_CURRENCY[trip.destination] || null;

  const [localCode,    setLocalCode]    = useState(detected?.code || '');
  const [localName,    setLocalName]    = useState(detected?.name || '');
  const [codeInput,    setCodeInput]    = useState('');   // manual override
  const [manualMode,   setManualMode]   = useState(!detected);

  const [rates,        setRates]        = useState(null); // { EUR, USD }
  const [rateDate,     setRateDate]     = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [rateError,    setRateError]    = useState(null);

  const [direction,    setDirection]    = useState('to_foreign'); // 'to_foreign' | 'to_local'
  const [foreignSel,   setForeignSel]   = useState('EUR');        // which foreign currency when to_local
  const [amount,       setAmount]       = useState('100');

  const isEurozone = localCode === 'EUR';
  const isDollar   = localCode === 'USD';
  const isForeign  = isEurozone || isDollar;

  useEffect(() => {
    if (localCode && localCode.length === 3) fetchRates(localCode);
  }, [localCode]);

  const fetchRates = async (code) => {
    if (!code || code.length !== 3) return;
    setLoading(true);
    setRateError(null);
    setRates(null);
    try {
      const res = await fetch(`/api/currency-rates?base=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRates(data.rates);
      setRateDate(data.date);
    } catch (err) {
      setRateError('Kurs nicht verfügbar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyManualCode = () => {
    const code = codeInput.trim().toUpperCase();
    if (code.length !== 3) return;
    setLocalCode(code);
    setLocalName(code);
    setManualMode(false);
  };

  const num = parseFloat(amount.replace(',', '.')) || 0;

  // Calculate results
  const toForeignResult = () => {
    if (!rates || !num) return null;
    const results = [];
    if (!isEurozone && rates.EUR != null) results.push({ code: 'EUR', symbol: '€', value: num * rates.EUR });
    if (!isDollar   && rates.USD != null) results.push({ code: 'USD', symbol: '$', value: num * rates.USD });
    // If local is EUR, show EUR→USD
    if (isEurozone  && rates.USD != null) results.push({ code: 'USD', symbol: '$', value: num * rates.USD });
    if (isDollar    && rates.EUR != null) results.push({ code: 'EUR', symbol: '€', value: num * rates.EUR });
    return results.length ? results : null;
  };

  const toLocalResult = () => {
    if (!rates || !num) return null;
    const rate = foreignSel === 'EUR' ? rates.EUR : rates.USD;
    if (rate == null || rate === 0) return null;
    return num / rate;
  };

  const foreignResults = direction === 'to_foreign' ? toForeignResult() : null;
  const localResult    = direction === 'to_local'   ? toLocalResult()   : null;

  const rateStr = () => {
    if (!rates) return null;
    const parts = [];
    if (!isEurozone && rates.EUR != null) parts.push(`1 ${localCode} = ${fmtNum(rates.EUR, 'EUR')} EUR`);
    if (!isDollar   && rates.USD != null) parts.push(`1 ${localCode} = ${fmtNum(rates.USD, 'USD')} USD`);
    if (isEurozone  && rates.USD != null) parts.push(`1 EUR = ${fmtNum(rates.USD, 'USD')} USD`);
    if (isDollar    && rates.EUR != null) parts.push(`1 USD = ${fmtNum(rates.EUR, 'EUR')} EUR`);
    return parts.join(' · ');
  };

  const quickAmounts = direction === 'to_foreign' ? QUICK_AMOUNTS_LOCAL : QUICK_AMOUNTS_FOREIGN;
  const inputCurrency = direction === 'to_foreign' ? localCode : foreignSel;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto', paddingBottom: 32 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2>💱 Währungsrechner</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: '1.4rem' }}>×</button>
        </div>

        {/* Detected currency */}
        <div style={{ marginBottom: 16 }}>
          {!manualMode && localCode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', borderRadius: 10, padding: '8px 12px' }}>
              <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                {trip.country || trip.destination} · <strong>{localName}</strong> ({localCode})
              </span>
              <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1d4ed8', borderRadius: 99, padding: '1px 8px', fontWeight: 600 }}>
                automatisch
              </span>
              <button
                onClick={() => { setManualMode(true); setCodeInput(localCode); }}
                style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
              >
                ändern
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                autoFocus
                value={codeInput}
                onChange={e => setCodeInput(e.target.value.toUpperCase().slice(0, 3))}
                onKeyDown={e => e.key === 'Enter' && applyManualCode()}
                placeholder="z.B. THB"
                maxLength={3}
                style={{ ...inputStyle, fontSize: '1rem', flex: 1, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              />
              <button
                className="btn btn-primary"
                onClick={applyManualCode}
                disabled={codeInput.trim().length !== 3}
                style={{ borderRadius: 12, padding: '10px 18px', fontWeight: 700 }}
              >
                OK
              </button>
            </div>
          )}
        </div>

        {/* Direction toggle */}
        {localCode && !manualMode && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: '#f1f5f9', padding: 4, borderRadius: 12 }}>
            <button style={tabBtn(direction === 'to_foreign')} onClick={() => setDirection('to_foreign')}>
              {localCode} → EUR / USD
            </button>
            <button style={tabBtn(direction === 'to_local')} onClick={() => setDirection('to_local')}>
              EUR / USD → {localCode}
            </button>
          </div>
        )}

        {/* Input + quick amounts */}
        {localCode && !manualMode && (
          <>
            {/* Foreign currency selector (when converting to local) */}
            {direction === 'to_local' && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {['EUR', 'USD'].map(fc => (
                  <button
                    key={fc}
                    onClick={() => setForeignSel(fc)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem',
                      border: '2px solid', cursor: 'pointer', transition: 'all 0.15s',
                      background: foreignSel === fc ? '#0f172a' : 'white',
                      borderColor: foreignSel === fc ? '#0f172a' : '#e2e8f0',
                      color: foreignSel === fc ? 'white' : '#475569',
                    }}
                  >
                    {fc === 'EUR' ? '💶 EUR' : '💵 USD'}
                  </button>
                ))}
              </div>
            )}

            {/* Amount input */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={inputStyle}
                placeholder="0"
              />
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8',
              }}>
                {inputCurrency}
              </span>
            </div>

            {/* Quick amount buttons */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {quickAmounts.map(q => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  style={{
                    padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600,
                    background: amount === String(q) ? '#0f172a' : '#f1f5f9',
                    color: amount === String(q) ? 'white' : '#475569',
                    border: 'none', borderRadius: 99, cursor: 'pointer',
                  }}
                >
                  {q.toLocaleString('de-DE')}
                </button>
              ))}
            </div>

            {/* Result */}
            {loading && (
              <div style={{ textAlign: 'center', color: '#3b82f6', fontSize: '0.85rem', padding: '16px 0' }}>
                Aktuellen Kurs abrufen…
              </div>
            )}
            {rateError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', color: '#991b1b', marginBottom: 12 }}>
                ⚠️ {rateError}
              </div>
            )}

            {!loading && !rateError && rates && direction === 'to_foreign' && foreignResults && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {foreignResults.map(r => (
                  <div key={r.code} style={{
                    background: r.code === 'EUR' ? 'linear-gradient(135deg, #eff6ff, #dbeafe)' : 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                    border: `1px solid ${r.code === 'EUR' ? '#bfdbfe' : '#a7f3d0'}`,
                    borderRadius: 14, padding: '14px 18px',
                    display: 'flex', alignItems: 'baseline', gap: 8,
                  }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: r.code === 'EUR' ? '#1d4ed8' : '#065f46', letterSpacing: '-0.02em' }}>
                      {fmtNum(r.value, r.code)}
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: r.code === 'EUR' ? '#3b82f6' : '#10b981' }}>
                      {r.symbol} {r.code}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!loading && !rateError && rates && direction === 'to_local' && localResult != null && (
              <div style={{
                background: 'linear-gradient(135deg, #fdf4ff, #ede9fe)',
                border: '1px solid #ddd6fe',
                borderRadius: 14, padding: '14px 18px', marginBottom: 16,
                display: 'flex', alignItems: 'baseline', gap: 8,
              }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#6d28d9', letterSpacing: '-0.02em' }}>
                  {fmtNum(localResult, localCode)}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#8b5cf6' }}>
                  {localCode}
                </span>
              </div>
            )}

            {!loading && !rateError && rates && direction === 'to_local' && localResult == null && num > 0 && (
              <div style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', padding: '12px 0' }}>
                Kurs für {foreignSel} → {localCode} nicht verfügbar
              </div>
            )}

            {/* Rate info */}
            {rates && rateStr() && (
              <div style={{ marginTop: 4, fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.6 }}>
                {rateStr()}
                {rateDate && <><br />📅 {new Date(rateDate).toLocaleDateString('de-DE')} · Quelle: currency-api</>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
