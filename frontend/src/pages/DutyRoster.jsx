import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  History,
  ArrowLeft,
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_markaz-rahma-1/artifacts/85zdrywf_Untitled%20design%20%281%29.png';

const PRAYERS = [
  { key: 'fajr', label: 'FAJR' },
  { key: 'dhuhr', label: 'DHUHR' },
  { key: 'asr', label: 'ASR' },
  { key: 'maghrib', label: 'MAGHRIB' },
  { key: 'ishaa', label: 'ISHAA' },
];

const toIsoDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const prettyDateFull = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const prettyDateShort = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  // e.g. "Thu, 7th May"
  const day = d.getDate();
  const suffix = (() => {
    if (day >= 11 && day <= 13) return 'th';
    const lastDigit = day % 10;
    if (lastDigit === 1) return 'st';
    if (lastDigit === 2) return 'nd';
    if (lastDigit === 3) return 'rd';
    return 'th';
  })();
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' });
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  return `${weekday}, ${day}${suffix} ${month}`;
};

// Site branding header (logo + title + markazrahma.org + ACTIVE pill)
const BrandingHeader = ({ rightLabel }) => (
  <div className="flex items-center justify-between gap-3 mb-6">
    <div className="flex items-center gap-3">
      <img src={LOGO_URL} alt="Markaz Al-Rahma" className="h-12 w-12 object-contain" />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Markaz Al-Rahma</h1>
        <p className="text-xs sm:text-sm text-gray-500">markazrahma.org</p>
      </div>
    </div>
    {rightLabel && (
      <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full" data-testid="status-pill">
        {rightLabel}
      </span>
    )}
  </div>
);

// Quran quote card
const QuoteCard = () => (
  <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-cyan-100 shadow-sm p-6 sm:p-8 mb-8 text-center">
    <p
      className="text-2xl sm:text-3xl text-gray-900 mb-4 leading-relaxed"
      style={{ fontFamily: '"Noto Naskh Arabic", "Amiri", serif', direction: 'rtl' }}
      data-testid="quote-arabic"
    >
      إِنَّ ٱلصَّلَوٰةَ كَانَتْ عَلَى ٱلْمُؤْمِنِينَ كِتَـٰبًا مَّوْقُوتًا
    </p>
    <p className="italic text-gray-600 text-sm sm:text-base mb-3 leading-relaxed max-w-xl mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
      &ldquo;Indeed, prayer has been decreed upon the believers a decree of specified times.&rdquo;
    </p>
    <p className="text-xs sm:text-sm font-semibold text-cyan-700 tracking-[0.15em] uppercase" data-testid="quote-citation">
      Surah An-Nisa &mdash; 4:103
    </p>
  </div>
);

// One prayer row card
const PrayerRowCard = ({ prayerKey, label, value, onChange, saving, lastSavedAt, highlighted }) => {
  return (
    <div
      className={`rounded-2xl border px-5 sm:px-6 py-4 sm:py-5 transition-all ${
        highlighted ? 'bg-cyan-50/80 border-cyan-400 shadow-sm' : 'bg-white border-gray-200'
      }`}
      data-testid={`duty-row-${prayerKey}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="shrink-0">
          <div className={`text-lg sm:text-xl font-bold tracking-wide ${highlighted ? 'text-cyan-800' : 'text-gray-900'}`}>
            {label}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">Opening duty</div>
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(prayerKey, e.target.value)}
            placeholder="Enter name…"
            className={`w-full bg-transparent text-right text-lg sm:text-2xl font-bold focus:outline-none ${
              highlighted ? 'text-cyan-900 placeholder:text-cyan-300' : 'text-gray-900 placeholder:text-gray-300'
            }`}
            data-testid={`duty-input-${prayerKey}`}
          />
          {saving && (
            <Loader2 className="absolute right-0 -bottom-5 h-3.5 w-3.5 animate-spin text-cyan-500" />
          )}
          {!saving && lastSavedAt && (
            <CheckCircle2 className="absolute right-0 -bottom-5 h-3.5 w-3.5 text-green-500" />
          )}
        </div>
      </div>
    </div>
  );
};

// Day editor (list of 5 prayer cards, auto-saving)
const DayEditor = ({ dateIso }) => {
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState(null);
  const [lastSaved, setLastSaved] = useState({});
  const debounceTimers = useRef({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/duty-roster/${dateIso}`);
      setRoster(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dateIso]);

  useEffect(() => { load(); }, [load]);

  const updateField = (key, newValue) => {
    setRoster((prev) => ({ ...prev, [key]: newValue }));
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(async () => {
      try {
        setSavingField(key);
        await axios.put(`${API}/api/duty-roster/${dateIso}`, { [key]: newValue });
        setLastSaved((prev) => ({ ...prev, [key]: Date.now() }));
      } catch (e) {
        console.error('Save failed', e);
      } finally {
        setSavingField(null);
      }
    }, 500);
  };

  if (loading || !roster) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {PRAYERS.map((p, idx) => (
        <PrayerRowCard
          key={p.key}
          prayerKey={p.key}
          label={p.label}
          value={roster[p.key] || ''}
          onChange={updateField}
          saving={savingField === p.key}
          lastSavedAt={lastSaved[p.key]}
          highlighted={idx === 0}
        />
      ))}
    </div>
  );
};

// Look Ahead view (date picker + editor)
const LookAheadView = ({ onBack }) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const isoDate = toIsoDate(selectedDate);

  const shift = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-cyan-700 hover:text-cyan-900 font-medium text-sm"
          data-testid="look-ahead-back"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <span className="text-xs font-semibold tracking-wider uppercase bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full">
          Look Ahead
        </span>
      </div>

      <div className="mb-5">
        <p className="text-xs font-bold tracking-[0.15em] text-gray-900 uppercase mb-1">Scheduling for</p>
        <p className="text-lg sm:text-xl font-semibold text-cyan-800">{prettyDateFull(isoDate)}</p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => shift(-1)}
          className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
          data-testid="look-ahead-prev"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-white px-4 py-2.5 text-gray-900 hover:bg-cyan-50 font-medium"
              data-testid="look-ahead-calendar-trigger"
            >
              <CalendarIcon className="h-4 w-4 text-cyan-700" />
              Pick a date
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} initialFocus />
          </PopoverContent>
        </Popover>
        <button
          onClick={() => shift(1)}
          className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
          data-testid="look-ahead-next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <DayEditor dateIso={isoDate} />
    </div>
  );
};

// History view
const HistoryView = ({ onBack }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/api/duty-roster?limit=60`);
        setItems(res.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-cyan-700 hover:text-cyan-900 font-medium text-sm"
          data-testid="history-back"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <span className="text-xs font-semibold tracking-wider uppercase bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full">
          History Log
        </span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading history…</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-gray-400">No history yet.</div>
      ) : (
        <div className="space-y-3" data-testid="duty-history-list">
          {items.map((item) => (
            <div key={item.date} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4" data-testid={`duty-history-${item.date}`}>
              <div className="text-sm font-semibold text-cyan-700 mb-3">{prettyDateFull(item.date)}</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                {PRAYERS.map((p) => (
                  <div key={p.key} className="bg-gray-50 rounded-lg px-3 py-2">
                    <div className="text-[10px] uppercase text-gray-500 tracking-wide">{p.label}</div>
                    <div className="font-medium text-gray-900 truncate">{item[p.key] || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DutyRoster = () => {
  const [view, setView] = useState('today'); // 'today' | 'lookahead' | 'history'
  const todayIso = toIsoDate(new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-cyan-50 py-6 sm:py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {view === 'today' && (
          <>
            <BrandingHeader rightLabel="Active" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-[0.15em] text-gray-900 uppercase" data-testid="today-label">
                Today&rsquo;s Responsibility
              </h2>
              <span className="text-sm text-gray-500" data-testid="today-short-date">{prettyDateShort(todayIso)}</span>
            </div>

            <QuoteCard />

            <DayEditor dateIso={todayIso} />

            <div className="mt-8 space-y-3">
              <button
                onClick={() => setView('lookahead')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-cyan-200 bg-white hover:bg-cyan-50 text-cyan-800 font-semibold text-base sm:text-lg py-4 transition-all"
                data-testid="duty-tab-lookahead"
              >
                <CalendarIcon className="h-5 w-5" />
                Look Ahead
              </button>

              <button
                onClick={() => setView('history')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl text-gray-600 hover:text-cyan-700 font-medium text-sm sm:text-base py-2 transition-colors"
                data-testid="duty-tab-history"
              >
                <History className="h-4 w-4" />
                History Log
              </button>
            </div>
          </>
        )}

        {view === 'lookahead' && (
          <>
            <BrandingHeader />
            <LookAheadView onBack={() => setView('today')} />
          </>
        )}

        {view === 'history' && (
          <>
            <BrandingHeader />
            <HistoryView onBack={() => setView('today')} />
          </>
        )}
      </div>
    </div>
  );
};

export default DutyRoster;
