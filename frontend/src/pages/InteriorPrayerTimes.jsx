import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Sunrise as SunriseIcon } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import HeroCarousel from '../components/sections/HeroCarousel';
import { usePrayerTimes } from '../services/api';
import { mosqueInfo } from '../data/mock';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_markaz-rahma-1/artifacts/85zdrywf_Untitled%20design%20%281%29.png';

const formatTime = (time) => {
  if (!time || time === 'N/A') return '—';
  return time;
};

const InteriorPrayerTimes = () => {
  const { prayerTimes, isLoading, mutate } = usePrayerTimes();
  const [now, setNow] = useState(new Date());
  const [searchParams] = useSearchParams();

  const orientation = (searchParams.get('orientation') || 'landscape').toLowerCase();
  const heroEnabled = searchParams.get('hero') !== 'off';
  const isPortrait = orientation === 'portrait';
  const intervalParam = parseInt(searchParams.get('interval') || '0', 10);
  const intervalOverride = intervalParam > 0 ? intervalParam * 1000 : null;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Silent revalidation: schedule a fetch ~5 seconds after each Iqamah passes
  // so the "Next" indicator and any updated CSV data are reflected without
  // any visible loading state. Re-arms automatically as the day progresses
  // and at midnight rolls over to the next day's prayers.
  useEffect(() => {
    if (!prayerTimes?.prayers || !mutate) return;

    const current = new Date();
    const currentMinutes = current.getHours() * 60 + current.getMinutes() + current.getSeconds() / 60;
    let nextEventDelayMs = null;

    for (const prayer of prayerTimes.prayers) {
      const [h, m] = (prayer.iqamah || '00:00').split(':').map(Number);
      if (Number.isNaN(h) || Number.isNaN(m)) continue;
      const prayerMinutes = h * 60 + m;
      // Fire 5 seconds after the iqamah moment
      const diffMin = prayerMinutes - currentMinutes;
      if (diffMin > 0) {
        nextEventDelayMs = Math.round(diffMin * 60 * 1000) + 5000;
        break;
      }
    }

    // After the last iqamah of the day, refresh once at next midnight + 5s
    if (nextEventDelayMs == null) {
      const midnight = new Date();
      midnight.setHours(24, 0, 5, 0);
      nextEventDelayMs = midnight.getTime() - current.getTime();
    }

    const timer = setTimeout(() => {
      // Silent revalidation — SWR keeps existing data on screen while refetching,
      // then swaps in the new payload with no flicker or loader.
      mutate();
    }, nextEventDelayMs);

    return () => clearTimeout(timer);
  }, [prayerTimes, mutate]);

  const getNextPrayer = () => {
    if (!prayerTimes) return null;
    const current = new Date();
    const currentMinutes = current.getHours() * 60 + current.getMinutes();
    for (const prayer of prayerTimes.prayers) {
      const [h, m] = (prayer.iqamah || '00:00').split(':').map(Number);
      if (h * 60 + m > currentMinutes) return prayer.name;
    }
    return prayerTimes.prayers[0]?.name;
  };

  const nextPrayer = getNextPrayer();
  const sunrise = prayerTimes?.sunrise && prayerTimes.sunrise !== 'N/A' ? prayerTimes.sunrise : null;

  const dateString = now.toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // Hijri date — compute via Intl Islamic calendar but use clean transliterated month names
  const HIJRI_MONTHS = [
    'Muharram',
    'Safar',
    "Rabi' al-Awwal",
    "Rabi' al-Thani",
    'Jumada al-Awwal',
    'Jumada al-Thani',
    'Rajab',
    "Sha'ban",
    'Ramadan',
    'Shawwal',
    "Dhul-Qi'dah",
    'Dhul-Hijjah',
  ];

  let hijriString = prayerTimes?.hijri_date || '';
  if (!hijriString) {
    try {
      const fmt = new Intl.DateTimeFormat('en-GB-u-ca-islamic-umalqura', {
        day: 'numeric', month: 'numeric', year: 'numeric',
      });
      const parts = fmt.formatToParts(now);
      const day = parts.find(p => p.type === 'day')?.value;
      const monthNum = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10);
      const year = parts.find(p => p.type === 'year')?.value;
      const monthName = HIJRI_MONTHS[monthNum - 1];
      if (day && monthName && year) {
        hijriString = `${day} ${monthName} ${year} AH`;
      }
    } catch (e) {
      hijriString = '';
    }
  }

  // Detect viewport orientation — used to auto-rotate the portrait layout
  // when the user opens it on a landscape device (e.g. a Firestick TV).
  const [shouldRotatePortrait, setShouldRotatePortrait] = useState(false);
  useEffect(() => {
    const update = () => {
      setShouldRotatePortrait(window.innerWidth > window.innerHeight);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const onDonate = () => {
    window.open('https://checkout.square.site/merchant/MLSD6EY5CMY2P/checkout/HXF33WVBEFWIA65YBXUQST3B?src=sheet', '_blank');
  };
  const onLocation = () => {
    window.open(mosqueInfo?.googleMapsUrl || 'https://maps.google.com', '_blank');
  };

  const pageBg = 'bg-gradient-to-br from-cyan-50 via-white to-cyan-50';

  // ============================================================
  // PORTRAIT LAYOUT — 3 horizontal sections side by side:
  //   [vertical header]  [vertical prayer cards]  [hero]
  // Header text rotated to read bottom→top with logo centered.
  // Each prayer is a vertical card: Iqamah on top, Adhan below,
  // prayer name rotated at the bottom.
  // ============================================================
  if (isPortrait) {
    const VText = ({ children, className = '', style = {} }) => (
      <span
        className={className}
        style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          whiteSpace: 'nowrap',
          ...style,
        }}
      >
        {children}
      </span>
    );

    const buildPrayerColumn = (key, label, isShuruq, isJummah, iqamah, adhan, isHighlighted) => {
      const cardBase = 'flex flex-col items-center justify-between rounded-xl px-4 py-5 transition-all min-w-[78px]';
      const bg = isShuruq
        ? 'bg-amber-50 border border-amber-200'
        : isJummah
        ? 'bg-cyan-600 text-white shadow-lg'
        : isHighlighted
        ? 'bg-cyan-50 border-2 border-cyan-500 shadow-lg'
        : 'bg-gray-50/70';

      const labelTone = isShuruq
        ? 'text-amber-700'
        : isJummah
        ? 'text-cyan-100'
        : isHighlighted
        ? 'text-cyan-700'
        : 'text-gray-500';
      const timeTone = isShuruq
        ? 'text-amber-700'
        : isJummah
        ? 'text-white'
        : isHighlighted
        ? 'text-cyan-700'
        : 'text-gray-900';
      const iqamahTone = isHighlighted ? 'text-cyan-700' : 'text-cyan-600';
      const nameTone = isShuruq
        ? 'text-amber-900'
        : isJummah
        ? 'text-white'
        : isHighlighted
        ? 'text-cyan-700'
        : 'text-gray-900';

      return (
        <div
          key={key}
          className={`${cardBase} ${bg} h-full`}
          data-testid={`portrait-prayer-${label.toLowerCase()}`}
        >
          {/* Top of card (right when in portrait): rotated time labels and values */}
          <div className="flex flex-col items-center gap-7 pt-2">
            {!isShuruq && (
              <div className="flex items-center gap-2">
                <VText className={`text-base uppercase tracking-wide ${labelTone}`}>{isJummah ? 'Time' : 'Adhan'}</VText>
                <VText className={`font-mono font-bold tabular-nums ${timeTone}`} style={{ fontSize: '4rem' }}>
                  {formatTime(adhan)}
                </VText>
              </div>
            )}
            {!isJummah && !isShuruq && (
              <div className="flex items-center gap-2">
                <VText className={`text-base uppercase tracking-wide ${labelTone}`}>Iqamah</VText>
                <VText className={`font-mono font-bold tabular-nums ${iqamahTone}`} style={{ fontSize: '4rem' }}>
                  {formatTime(iqamah)}
                </VText>
              </div>
            )}
            {isShuruq && (
              <VText className={`font-mono font-bold tabular-nums ${timeTone}`} style={{ fontSize: '4rem' }}>
                {formatTime(adhan)}
              </VText>
            )}
          </div>

          {/* Bottom of card (left when in portrait): icon, Next badge, prayer name */}
          <div className="flex flex-col items-center gap-3 mt-3 pb-2">
            {isHighlighted && (
              <VText
                className="bg-cyan-600 text-white px-3 py-1 rounded-full text-sm uppercase font-semibold"
              >
                Next
              </VText>
            )}
            {isShuruq ? (
              <SunriseIcon
                className="h-7 w-7 text-amber-500"
                style={{ transform: 'rotate(-90deg)' }}
              />
            ) : (
              <Clock
                className={`h-7 w-7 ${isJummah ? 'text-cyan-100' : isHighlighted ? 'text-cyan-700' : 'text-cyan-600'}`}
                style={{ transform: 'rotate(-90deg)' }}
              />
            )}
            <VText
              className={`font-bold tracking-wide ${nameTone}`}
              style={{ fontSize: isJummah ? '2.2rem' : '2.8rem', lineHeight: '1.05' }}
            >
              {label}
            </VText>
          </div>
        </div>
      );
    };

    return (
      <div className={`relative h-screen w-screen overflow-hidden ${pageBg}`} data-testid="interior-display-page">
        <div
          className="grid gap-3 px-3 pb-3"
          style={{
            ...(shouldRotatePortrait
              ? {
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  width: '100vh',
                  height: '100vw',
                  transform: 'translate(-50%, -50%) rotate(90deg)',
                  transformOrigin: 'center center',
                }
              : { width: '100%', height: '100%' }),
            gridTemplateColumns: heroEnabled
              ? 'minmax(220px, 1.8fr) minmax(0, 5fr) minmax(0, 4fr)'
              : 'minmax(220px, 1.8fr) minmax(0, 4fr)',
          }}
        >
          {/* HEADER COLUMN — logo perfectly centered (aligned with carousel center); clock + title pinned to top/bottom */}
          <div
            className="relative h-full w-full"
            data-testid="portrait-header-column"
          >
            <div
              className="absolute font-mono font-bold text-cyan-700 tabular-nums"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '3.4rem', top: '24px', left: '50%', transformOrigin: 'center' }}
              data-testid="portrait-clock"
            >
              <span style={{ display: 'block', transform: 'translateX(-50%)' }}>{timeString}</span>
            </div>

            <div className="flex items-center justify-center w-full h-full overflow-visible">
              <img
                src={LOGO_URL}
                alt="Markaz Al-Rahma"
                className="object-contain"
                style={{ transform: 'rotate(-90deg)', width: '95%', height: 'auto', maxHeight: '95%' }}
                data-testid="portrait-logo"
              />
            </div>

            <div
              className="absolute flex flex-col items-start"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg) translateX(50%)', bottom: '24px', left: '50%' }}
            >
              <span className="font-bold text-cyan-700" style={{ fontSize: '1.6rem', lineHeight: '1.1', whiteSpace: 'nowrap' }} data-testid="portrait-title">
                Markaz Al-Rahma
              </span>
              <span className="text-gray-600 mt-1" style={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }} data-testid="portrait-date">
                {dateString}
              </span>
              {hijriString && (
                <span className="text-cyan-600 font-medium" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }} data-testid="portrait-hijri">
                  {hijriString}
                </span>
              )}
            </div>
          </div>

          {/* MIDDLE — Prayer cards */}
          <div className="flex items-stretch min-w-0">
            {!prayerTimes && !isLoading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">No prayer times</div>
            ) : isLoading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">Loading…</div>
            ) : (
              <Card className="shadow-2xl border-t-4 border-t-cyan-600 bg-white/80 backdrop-blur-sm flex-1 overflow-hidden">
                <CardContent className="p-3 h-full flex gap-2 items-stretch justify-end">
                  {prayerTimes.prayers.map((prayer) => {
                    const isHighlighted = prayer.name === nextPrayer;
                    const cards = [
                      buildPrayerColumn(
                        prayer.name,
                        prayer.name,
                        false,
                        false,
                        prayer.iqamah,
                        prayer.adhan,
                        isHighlighted
                      ),
                    ];
                    if (prayer.name === 'Fajr' && sunrise) {
                      cards.push(
                        buildPrayerColumn('Shuruq', 'Shuruq', true, false, null, sunrise, false)
                      );
                    }
                    return cards;
                  })}
                  {prayerTimes.jummah && (
                    buildPrayerColumn('Jummah', 'Jummah (Friday)', false, true, null, prayerTimes.jummah.time, false)
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* HERO — rotated 90° CCW so its landscape content fits the portrait pane */}
          {heroEnabled && (
            <div
              className="relative h-full w-full overflow-hidden"
              data-testid="portrait-carousel"
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 'calc(100vh - 24px)',
                  height: '100%',
                  transform: 'translate(-50%, -50%) rotate(-90deg)',
                  transformOrigin: 'center center',
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <HeroCarousel
                    onDonate={onDonate}
                    onLocation={onLocation}
                    intervalOverride={intervalOverride}
                    hideArrows
                    transparent
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // LANDSCAPE LAYOUTS (unchanged from previous step)
  // ============================================================
  const titleSize = !heroEnabled ? 'text-4xl xl:text-5xl 2xl:text-6xl' : 'text-3xl lg:text-4xl xl:text-5xl';
  const clockSize = !heroEnabled ? 'text-6xl xl:text-7xl 2xl:text-8xl' : 'text-5xl lg:text-6xl xl:text-7xl';
  const dateSize = !heroEnabled ? 'text-lg xl:text-xl' : 'text-base lg:text-lg xl:text-xl';
  const prayerNameSize = !heroEnabled ? 'text-4xl xl:text-5xl 2xl:text-6xl' : 'text-4xl lg:text-5xl xl:text-6xl';
  const prayerTimeSize = !heroEnabled ? 'text-4xl xl:text-5xl 2xl:text-6xl' : 'text-4xl lg:text-5xl xl:text-6xl';
  const labelSize = !heroEnabled ? 'text-base xl:text-lg' : 'text-sm lg:text-base';
  const iconSize = !heroEnabled ? 'h-10 w-10 xl:h-12 xl:w-12' : 'h-10 w-10 lg:h-12 lg:w-12';

  const PrayerTimesCard = (
    <Card className="shadow-2xl border-t-4 border-t-cyan-600 bg-white/80 backdrop-blur-sm flex-1 flex flex-col overflow-hidden">
      <CardContent className="p-2 lg:p-3 xl:p-4 flex-1 flex flex-col justify-around gap-1 lg:gap-1.5 xl:gap-2">
        {prayerTimes?.prayers.map((prayer) => {
          const isNext = prayer.name === nextPrayer;
          const showShuruq = prayer.name === 'Fajr' && sunrise;
          return (
            <React.Fragment key={prayer.name}>
              <div
                className={`flex items-center justify-between px-3 lg:px-4 xl:px-5 py-1.5 lg:py-2 xl:py-2.5 rounded-xl transition-all ${
                  isNext ? 'bg-cyan-50 border-2 border-cyan-500 shadow-lg' : 'bg-gray-50/70'
                }`}
              >
                <div className="flex items-center gap-2 lg:gap-3 xl:gap-4">
                  <Clock className={`${iconSize} ${isNext ? 'text-cyan-700' : 'text-cyan-600'}`} />
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${prayerNameSize} ${isNext ? 'text-cyan-700' : 'text-gray-900'}`}>{prayer.name}</span>
                    {isNext && <span className={`bg-cyan-600 text-white px-2.5 py-1 rounded-full ${labelSize}`}>Next</span>}
                  </div>
                </div>
                <div className="flex gap-5 lg:gap-8 xl:gap-12">
                  <div className="text-right">
                    <div className={`text-gray-500 mb-0.5 ${labelSize}`}>Adhan</div>
                    <div className={`font-mono font-semibold tabular-nums ${prayerTimeSize} ${isNext ? 'text-cyan-700' : 'text-gray-900'}`}>{formatTime(prayer.adhan)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-gray-500 mb-0.5 ${labelSize}`}>Iqamah</div>
                    <div className={`font-mono font-semibold tabular-nums ${prayerTimeSize} ${isNext ? 'text-cyan-700' : 'text-cyan-600'}`}>{formatTime(prayer.iqamah)}</div>
                  </div>
                </div>
              </div>
              {showShuruq && (
                <div className="flex items-center justify-between px-3 lg:px-4 xl:px-5 py-1.5 lg:py-2 xl:py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 lg:gap-3 xl:gap-4">
                    <SunriseIcon className={`${iconSize} text-amber-500`} />
                    <div className="flex items-baseline gap-2">
                      <span className={`font-bold text-amber-900 ${prayerNameSize}`}>Shuruq</span>
                      <span className={`text-amber-700 ${labelSize}`}>(Sunrise)</span>
                    </div>
                  </div>
                  <div className={`font-mono font-semibold tabular-nums text-amber-700 ${prayerTimeSize}`}>{formatTime(sunrise)}</div>
                </div>
              )}
            </React.Fragment>
          );
        })}
        {prayerTimes?.jummah && (
          <div className="px-3 lg:px-4 xl:px-5 py-1.5 lg:py-2 xl:py-2.5 bg-cyan-600 text-white rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 lg:gap-3 xl:gap-4">
                <Clock className={iconSize} />
                <span className={`font-bold ${prayerNameSize}`}>Jummah (Friday)</span>
              </div>
              <div className="text-right">
                <div className={`text-cyan-100 mb-0.5 ${labelSize}`}>Time</div>
                <div className={`font-mono font-semibold tabular-nums ${prayerTimeSize}`}>{formatTime(prayerTimes.jummah.time)}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const HeaderBar = (
    <div className="flex items-center justify-between gap-4 px-6 lg:px-10 xl:px-12 pt-2 lg:pt-3" data-testid="landscape-header-bar">
      <div className="flex-1">
        <h1 className={`font-bold text-cyan-700 ${titleSize}`}>Markaz Al-Rahma</h1>
        <p className={`text-gray-600 mt-1 ${dateSize}`}>{dateString}</p>
        {hijriString && (
          <p className={`text-cyan-600 font-medium ${dateSize}`} data-testid="landscape-hijri">{hijriString}</p>
        )}
      </div>
      <div className="flex-shrink-0 flex items-center justify-center">
        <img
          src={LOGO_URL}
          alt="Markaz Al-Rahma"
          className={!heroEnabled ? 'h-44 xl:h-52 2xl:h-60 object-contain' : 'h-36 lg:h-44 xl:h-52 object-contain'}
          data-testid="landscape-logo"
        />
      </div>
      <div className="flex-1 flex justify-end">
        <div className={`font-mono font-bold text-cyan-700 tabular-nums ${clockSize}`} data-testid="interior-clock">
          {timeString}
        </div>
      </div>
    </div>
  );

  if (!heroEnabled) {
    return (
      <div className={`h-screen w-screen overflow-hidden ${pageBg}`} data-testid="interior-display-page">
        <div className="grid grid-cols-1 grid-rows-[auto_minmax(0,1fr)] h-full">
          {HeaderBar}
          <div className="px-3 lg:px-4 pb-3 lg:pb-4 flex">{PrayerTimesCard}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen overflow-hidden ${pageBg}`} data-testid="interior-display-page">
      <div className="grid grid-rows-[auto_minmax(0,1fr)] h-full">
        {HeaderBar}
        <div className="grid grid-cols-1 lg:grid-cols-2 grid-rows-1 h-full overflow-hidden">
          <div className="flex flex-col h-full px-3 lg:px-4 pb-3 lg:pb-4 overflow-hidden">
            <div className="flex-1 overflow-hidden flex">{PrayerTimesCard}</div>
          </div>
          <div className="relative h-full w-full flex items-center justify-center p-2 lg:p-4 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <HeroCarousel
                onDonate={onDonate}
                onLocation={onLocation}
                intervalOverride={intervalOverride}
                hideArrows
                transparent
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteriorPrayerTimes;
