import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Sunrise as SunriseIcon } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import HeroCarousel from '../components/sections/HeroCarousel';
import { usePrayerTimes } from '../services/api';
import { mosqueInfo } from '../data/mock';

const formatTime = (time) => {
  if (!time || time === 'N/A') return '—';
  return time;
};

const InteriorPrayerTimes = () => {
  const { prayerTimes, isLoading } = usePrayerTimes();
  const [now, setNow] = useState(new Date());
  const [searchParams] = useSearchParams();

  const orientation = (searchParams.get('orientation') || 'landscape').toLowerCase(); // 'landscape' | 'portrait'
  const heroEnabled = searchParams.get('hero') !== 'off';
  const isPortrait = orientation === 'portrait';

  // Live clock
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
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const onDonate = () => {
    window.open('https://checkout.square.site/merchant/MLSD6EY5CMY2P/checkout/HXF33WVBEFWIA65YBXUQST3B?src=sheet', '_blank');
  };
  const onLocation = () => {
    window.open(mosqueInfo?.googleMapsUrl || 'https://maps.google.com', '_blank');
  };

  // Layout grid changes based on orientation + heroEnabled
  let gridClass;
  if (!heroEnabled) {
    gridClass = 'grid-cols-1 grid-rows-1';
  } else if (isPortrait) {
    // Portrait display: prayer times on top, carousel below
    gridClass = 'grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)]';
  } else {
    gridClass = 'grid-cols-1 lg:grid-cols-2 grid-rows-1';
  }

  // Sizing scales — bigger when carousel is hidden (full-page)
  const titleSize = !heroEnabled ? 'text-5xl xl:text-6xl 2xl:text-7xl' : 'text-3xl lg:text-4xl xl:text-5xl';
  const clockSize = !heroEnabled ? 'text-6xl xl:text-7xl 2xl:text-8xl' : 'text-4xl lg:text-5xl xl:text-6xl';
  const dateSize = !heroEnabled ? 'text-xl xl:text-2xl' : 'text-base lg:text-lg';
  const prayerNameSize = !heroEnabled ? 'text-3xl xl:text-4xl 2xl:text-5xl' : 'text-2xl lg:text-3xl xl:text-4xl';
  const prayerTimeSize = !heroEnabled ? 'text-4xl xl:text-5xl 2xl:text-6xl' : 'text-2xl lg:text-3xl xl:text-4xl';
  const labelSize = !heroEnabled ? 'text-sm xl:text-base' : 'text-xs lg:text-sm';
  const iconSize = !heroEnabled ? 'h-8 w-8 xl:h-10 xl:w-10' : 'h-6 w-6 lg:h-7 lg:w-7';

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-cyan-50"
      data-testid="interior-display-page"
    >
      <div className={`grid ${gridClass} h-full`}>
        {/* Prayer Times pane */}
        <div className="flex flex-col p-6 lg:p-10 xl:p-12 overflow-hidden">
          <div className="mb-4 lg:mb-6 xl:mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className={`font-bold text-cyan-700 ${titleSize}`}>Markaz Al-Rahma</h1>
              <p className={`text-gray-600 mt-2 ${dateSize}`}>{dateString}</p>
              {prayerTimes?.hijri_date && (
                <p className={`text-cyan-600 font-medium ${dateSize}`}>{prayerTimes.hijri_date}</p>
              )}
            </div>
            <div className="text-right">
              <div className={`font-mono font-bold text-cyan-700 tabular-nums ${clockSize}`} data-testid="interior-clock">
                {timeString}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-2xl">
              Loading prayer times…
            </div>
          ) : !prayerTimes ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-2xl">
              No prayer times available
            </div>
          ) : (
            <Card className="shadow-2xl border-t-4 border-t-cyan-600 bg-white/80 backdrop-blur-sm flex-1 flex flex-col overflow-hidden">
              <CardContent className="p-4 lg:p-6 xl:p-8 flex-1 flex flex-col justify-around gap-2 lg:gap-3 xl:gap-4">
                {prayerTimes.prayers.map((prayer) => {
                  const isNext = prayer.name === nextPrayer;
                  const showShuruq = prayer.name === 'Fajr' && sunrise;
                  return (
                    <React.Fragment key={prayer.name}>
                      <div
                        className={`flex items-center justify-between px-4 lg:px-6 xl:px-8 py-3 lg:py-4 xl:py-5 rounded-xl transition-all ${
                          isNext ? 'bg-cyan-50 border-2 border-cyan-500 shadow-lg' : 'bg-gray-50/70'
                        }`}
                        data-testid={`interior-prayer-${prayer.name.toLowerCase()}`}
                      >
                        <div className="flex items-center gap-3 lg:gap-4 xl:gap-5">
                          <Clock className={`${iconSize} ${isNext ? 'text-cyan-700' : 'text-cyan-600'}`} />
                          <div className="flex items-center gap-2 lg:gap-3">
                            <span className={`font-bold ${prayerNameSize} ${isNext ? 'text-cyan-700' : 'text-gray-900'}`}>
                              {prayer.name}
                            </span>
                            {isNext && (
                              <span className={`bg-cyan-600 text-white px-2.5 py-1 rounded-full ${labelSize}`}>
                                Next
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-6 lg:gap-10 xl:gap-14">
                          <div className="text-right">
                            <div className={`text-gray-500 mb-0.5 lg:mb-1 ${labelSize}`}>Adhan</div>
                            <div className={`font-mono font-semibold tabular-nums ${prayerTimeSize} ${isNext ? 'text-cyan-700' : 'text-gray-900'}`}>
                              {formatTime(prayer.adhan)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-gray-500 mb-0.5 lg:mb-1 ${labelSize}`}>Iqamah</div>
                            <div className={`font-mono font-semibold tabular-nums ${prayerTimeSize} ${isNext ? 'text-cyan-700' : 'text-cyan-600'}`}>
                              {formatTime(prayer.iqamah)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {showShuruq && (
                        <div
                          className="flex items-center justify-between px-4 lg:px-6 xl:px-8 py-3 lg:py-4 xl:py-5 rounded-xl bg-amber-50 border border-amber-200"
                          data-testid="interior-shuruq-row"
                        >
                          <div className="flex items-center gap-3 lg:gap-4 xl:gap-5">
                            <SunriseIcon className={`${iconSize} text-amber-500`} />
                            <div className="flex items-baseline gap-2">
                              <span className={`font-bold text-amber-900 ${prayerNameSize}`}>Shuruq</span>
                              <span className={`text-amber-700 ${labelSize}`}>(Sunrise)</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-mono font-semibold tabular-nums text-amber-700 ${prayerTimeSize}`}>
                              {formatTime(sunrise)}
                            </div>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {prayerTimes.jummah && (
                  <div
                    className="px-4 lg:px-6 xl:px-8 py-3 lg:py-4 xl:py-5 bg-cyan-600 text-white rounded-xl shadow-lg"
                    data-testid="interior-jummah-row"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 lg:gap-4 xl:gap-5">
                        <Clock className={iconSize} />
                        <span className={`font-bold ${prayerNameSize}`}>Jummah (Friday)</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-cyan-100 mb-0.5 lg:mb-1 ${labelSize}`}>Time</div>
                        <div className={`font-mono font-semibold tabular-nums ${prayerTimeSize}`}>
                          {formatTime(prayerTimes.jummah.time)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Hero Carousel pane (centered) */}
        {heroEnabled && (
          <div
            className="relative h-full w-full flex items-center justify-center p-4 lg:p-6 xl:p-8 overflow-hidden"
            data-testid="interior-carousel-half"
          >
            <div className="w-full h-full max-h-full flex items-center justify-center">
              <HeroCarousel onDonate={onDonate} onLocation={onLocation} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteriorPrayerTimes;
