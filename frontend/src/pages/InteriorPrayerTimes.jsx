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
  const { prayerTimes, isLoading } = usePrayerTimes();
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
  const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

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
          {/* Top: rotated time labels and values (Adhan on top, Iqamah below) */}
          <div className="flex flex-col items-center gap-6 flex-1 justify-center">
            {!isShuruq && (
              <div className="flex items-center gap-2">
                <VText className={`text-base uppercase tracking-wide ${labelTone}`}>{isJummah ? 'Time' : 'Adhan'}</VText>
                <VText className={`font-mono font-bold tabular-nums ${timeTone}`} style={{ fontSize: '3.2rem' }}>
                  {formatTime(adhan)}
                </VText>
              </div>
            )}
            {!isJummah && !isShuruq && (
              <div className="flex items-center gap-2">
                <VText className={`text-base uppercase tracking-wide ${labelTone}`}>Iqamah</VText>
                <VText className={`font-mono font-bold tabular-nums ${iqamahTone}`} style={{ fontSize: '3.2rem' }}>
                  {formatTime(iqamah)}
                </VText>
              </div>
            )}
            {isShuruq && (
              <VText className={`font-mono font-bold tabular-nums ${timeTone}`} style={{ fontSize: '3.2rem' }}>
                {formatTime(adhan)}
              </VText>
            )}
          </div>

          {/* Bottom: rotated icon, Next badge, prayer name */}
          <div className="flex flex-col items-center gap-3 mt-3">
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
      <div className={`h-screen w-screen overflow-hidden ${pageBg}`} data-testid="interior-display-page">
        <div
          className="h-full w-full grid gap-3 px-3 pb-3"
          style={{
            gridTemplateColumns: heroEnabled
              ? 'minmax(120px, 1fr) minmax(0, 4fr) minmax(0, 5.5fr)'
              : 'minmax(140px, 1.2fr) minmax(0, 4fr)',
          }}
        >
          {/* HEADER COLUMN — vertical text + bigger logo in middle */}
          <div
            className="relative flex flex-col items-center justify-between py-6"
            data-testid="portrait-header-column"
          >
            <div
              className="font-mono font-bold text-cyan-700 tabular-nums"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '2.2rem' }}
              data-testid="portrait-clock"
            >
              {timeString}
            </div>

            <img
              src={LOGO_URL}
              alt="Markaz Al-Rahma"
              className="w-full max-w-[340px] object-contain"
              style={{ transform: 'rotate(-90deg)' }}
              data-testid="portrait-logo"
            />

            <div
              className="flex items-center gap-2"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              <span className="font-bold text-cyan-700" style={{ fontSize: '1.6rem', lineHeight: '1.1', whiteSpace: 'nowrap' }}>
                Markaz Al-Rahma
              </span>
              <span className="text-gray-600" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                {dateString}
              </span>
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
  const titleSize = !heroEnabled ? 'text-5xl xl:text-6xl 2xl:text-7xl' : 'text-3xl lg:text-4xl xl:text-5xl';
  const clockSize = !heroEnabled ? 'text-7xl xl:text-8xl 2xl:text-9xl' : 'text-5xl lg:text-6xl xl:text-7xl';
  const dateSize = !heroEnabled ? 'text-xl xl:text-2xl' : 'text-base lg:text-lg xl:text-xl';
  const prayerNameSize = !heroEnabled ? 'text-3xl xl:text-4xl 2xl:text-5xl' : 'text-2xl lg:text-3xl xl:text-4xl';
  const prayerTimeSize = !heroEnabled ? 'text-4xl xl:text-5xl 2xl:text-6xl' : 'text-2xl lg:text-3xl xl:text-4xl';
  const labelSize = !heroEnabled ? 'text-sm xl:text-base' : 'text-xs lg:text-sm';
  const iconSize = !heroEnabled ? 'h-8 w-8 xl:h-10 xl:w-10' : 'h-6 w-6 lg:h-7 lg:w-7';

  const PrayerTimesCard = (
    <Card className="shadow-2xl border-t-4 border-t-cyan-600 bg-white/80 backdrop-blur-sm flex-1 flex flex-col overflow-hidden">
      <CardContent className="p-3 lg:p-5 xl:p-6 flex-1 flex flex-col justify-around gap-2 lg:gap-3">
        {prayerTimes?.prayers.map((prayer) => {
          const isNext = prayer.name === nextPrayer;
          const showShuruq = prayer.name === 'Fajr' && sunrise;
          return (
            <React.Fragment key={prayer.name}>
              <div
                className={`flex items-center justify-between px-3 lg:px-5 xl:px-7 py-2 lg:py-3 xl:py-4 rounded-xl transition-all ${
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
                <div className="flex items-center justify-between px-3 lg:px-5 xl:px-7 py-2 lg:py-3 xl:py-4 rounded-xl bg-amber-50 border border-amber-200">
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
          <div className="px-3 lg:px-5 xl:px-7 py-2 lg:py-3 xl:py-4 bg-cyan-600 text-white rounded-xl shadow-lg">
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
        {prayerTimes?.hijri_date && <p className={`text-cyan-600 font-medium ${dateSize}`}>{prayerTimes.hijri_date}</p>}
      </div>
      <div className="flex-shrink-0 flex items-center justify-center">
        <img
          src={LOGO_URL}
          alt="Markaz Al-Rahma"
          className={!heroEnabled ? 'h-32 xl:h-40 2xl:h-48 object-contain' : 'h-24 lg:h-28 xl:h-32 object-contain'}
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
