import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar as CalendarIcon, CheckCircle2, Loader2, ChevronLeft, ChevronRight, History, CalendarRange } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const PRAYERS = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'ishaa', label: 'Ishaa' },
];

// Format helpers
const toIsoDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const prettyDate = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

// Prayer row with auto-save debounce
const PrayerRow = ({ prayerKey, label, value, onChange, saving, lastSavedAt }) => {
  return (
    <div className="flex items-center gap-3 py-2.5" data-testid={`duty-row-${prayerKey}`}>
      <Label className="w-24 text-lg font-semibold text-cyan-700 shrink-0">{label}</Label>
      <div className="flex-1 relative">
        <Input
          value={value}
          onChange={(e) => onChange(prayerKey, e.target.value)}
          placeholder={prayerKey === 'fajr' ? 'Abu Mohamed (default)' : 'Enter name…'}
          className="text-base h-11 pr-10"
          data-testid={`duty-input-${prayerKey}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          {saving ? <Loader2 className="h-4 w-4 animate-spin text-cyan-500" /> :
           lastSavedAt ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : null}
        </div>
      </div>
    </div>
  );
};

// Reusable card editor for one date
const DayEditor = ({ dateIso, compact = false }) => {
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

  useEffect(() => {
    load();
  }, [load]);

  const updateField = (key, newValue) => {
    setRoster((prev) => ({ ...prev, [key]: newValue }));
    // Debounce save per field
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
      <div className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className={compact ? 'py-2' : 'py-4'}>
      {PRAYERS.map((p) => (
        <PrayerRow
          key={p.key}
          prayerKey={p.key}
          label={p.label}
          value={roster[p.key] || ''}
          onChange={updateField}
          saving={savingField === p.key}
          lastSavedAt={lastSaved[p.key]}
        />
      ))}
      <p className="text-xs text-gray-400 mt-3 italic">
        Changes auto-save as you type. No need to click a button.
      </p>
    </div>
  );
};

// History Log tab
const HistoryLog = () => {
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

  if (loading) return <div className="py-10 text-center text-gray-400"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading history…</div>;
  if (items.length === 0) return <div className="py-10 text-center text-gray-400">No history yet.</div>;

  return (
    <div className="space-y-3" data-testid="duty-history-list">
      {items.map((item) => (
        <div key={item.date} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4" data-testid={`duty-history-${item.date}`}>
          <div className="text-sm font-semibold text-cyan-700 mb-2">{prettyDate(item.date)}</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
            {PRAYERS.map((p) => (
              <div key={p.key} className="bg-gray-50 rounded px-2 py-1.5">
                <div className="text-[10px] uppercase text-gray-500">{p.label}</div>
                <div className="font-medium text-gray-900 truncate">{item[p.key] || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Look Ahead tab
const LookAhead = () => {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="outline" onClick={() => shift(-1)} data-testid="look-ahead-prev"><ChevronLeft className="h-4 w-4 mr-1" />Prev day</Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 max-w-sm justify-center" data-testid="look-ahead-calendar-trigger">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {prettyDate(isoDate)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button variant="outline" onClick={() => shift(1)} data-testid="look-ahead-next">Next day<ChevronRight className="h-4 w-4 ml-1" /></Button>
      </div>

      <Card className="border-t-4 border-t-cyan-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-cyan-700">{prettyDate(isoDate)}</CardTitle>
          <CardDescription>Assign who will open the mosque on this date</CardDescription>
        </CardHeader>
        <CardContent>
          <DayEditor dateIso={isoDate} compact />
        </CardContent>
      </Card>
    </div>
  );
};

const DutyRoster = () => {
  const [tab, setTab] = useState('today'); // 'today' | 'lookahead' | 'history'
  const todayIso = toIsoDate(new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-cyan-50 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-cyan-700">Mosque Opening Duty Roster</h1>
          <p className="text-gray-600 mt-1">Who is opening the mosque for each prayer today?</p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={tab === 'today' ? 'default' : 'outline'}
            className={tab === 'today' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
            onClick={() => setTab('today')}
            data-testid="duty-tab-today"
          >
            Today
          </Button>
          <Button
            variant={tab === 'lookahead' ? 'default' : 'outline'}
            className={tab === 'lookahead' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
            onClick={() => setTab('lookahead')}
            data-testid="duty-tab-lookahead"
          >
            <CalendarRange className="h-4 w-4 mr-1.5" />
            Look Ahead
          </Button>
          <Button
            variant={tab === 'history' ? 'default' : 'outline'}
            className={tab === 'history' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
            onClick={() => setTab('history')}
            data-testid="duty-tab-history"
          >
            <History className="h-4 w-4 mr-1.5" />
            History
          </Button>
        </div>

        {tab === 'today' && (
          <Card className="border-t-4 border-t-cyan-600 shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl text-cyan-700">Today — {prettyDate(todayIso)}</CardTitle>
              <CardDescription>Fajr is led by Abu Mohamed by default. Fill in the rest as you know them.</CardDescription>
            </CardHeader>
            <CardContent>
              <DayEditor dateIso={todayIso} />
            </CardContent>
          </Card>
        )}

        {tab === 'lookahead' && <LookAhead />}
        {tab === 'history' && <HistoryLog />}
      </div>
    </div>
  );
};

export default DutyRoster;
