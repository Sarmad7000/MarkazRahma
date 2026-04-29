import React, { useEffect, useState } from 'react';
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

  // Live clock for header
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Compute next prayer based on Iqamah times
  const getNextPrayer = () => {
    if (!prayerTimes) return null;
    const current = new Date();
    const currentMinutes = current.getHours() * 60 + current.getMinutes();
    for (const prayer of prayerTimes.prayers) {
      const [h, m] = (prayer.iqamah || '00:00').split(':').map(Number);
      const prayerMinutes = h * 60 + m;
      if (prayerMinutes > currentMinutes) return prayer.name;
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

  return (
    <div
      className="h-screen w-screen bg-gradient-to-br from-cyan-50 via-white to-cyan-50 overflow-hidden"
      data-testid="interior-display-page"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
        {/* LEFT — Prayer Times */}
        <div className="flex flex-col p-6 lg:p-10 overflow-y-auto">
          <div className="mb-6 lg:mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-5xl font-bold text-cyan-700">Markaz Al-Rahma</h1>
              <p className="text-gray-600 mt-2 text-sm lg:text-base">{dateString}</p>
              {prayerTimes?.hijri_date && (
                <p className="text-cyan-600 font-medium text-sm lg:text-base">{prayerTimes.hijri_date}</p>
              )}
            </div>
            <div className="text-right">
              <div className="font-mono text-3xl lg:text-5xl font-bold text-cyan-700 tabular-nums" data-testid="interior-clock">
                {timeString}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Loading prayer times…
            </div>
          ) : !prayerTimes ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              No prayer times available
            </div>
          ) : (
            <Card className="shadow-xl border-t-4 border-t-cyan-600 flex-1">
              <CardContent className="p-4 lg:p-6">
                <div className="space-y-2 lg:space-y-3">
                  {prayerTimes.prayers.map((prayer) => {
                    const isNext = prayer.name === nextPrayer;
                    const showShuruq = prayer.name === 'Fajr' && sunrise;
                    return (
                      <React.Fragment key={prayer.name}>
                        <div
                          className={`flex items-center justify-between p-3 lg:p-4 rounded-lg transition-all ${
                            isNext ? 'bg-cyan-50 border-2 border-cyan-500 shadow-md' : 'bg-gray-50'
                          }`}
                          data-testid={`interior-prayer-${prayer.name.toLowerCase()}`}
                        >
                          <div className="flex items-center gap-2 lg:gap-3">
                            <Clock className={`h-5 w-5 lg:h-6 lg:w-6 ${isNext ? 'text-cyan-700' : 'text-cyan-600'}`} />
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold text-lg lg:text-2xl ${isNext ? 'text-cyan-700' : 'text-gray-900'}`}>
                                {prayer.name}
                              </span>
                              {isNext && (
                                <span className="text-xs bg-cyan-600 text-white px-2 py-0.5 rounded-full">
                                  Next
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-4 lg:gap-10">
                            <div className="text-right">
                              <div className="text-[10px] lg:text-xs text-gray-500 mb-0.5">Adhan</div>
                              <div className={`font-mono text-base lg:text-2xl font-semibold ${isNext ? 'text-cyan-700' : 'text-gray-900'}`}>
                                {formatTime(prayer.adhan)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] lg:text-xs text-gray-500 mb-0.5">Iqamah</div>
                              <div className={`font-mono text-base lg:text-2xl font-semibold ${isNext ? 'text-cyan-700' : 'text-cyan-600'}`}>
                                {formatTime(prayer.iqamah)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {showShuruq && (
                          <div
                            className="flex items-center justify-between p-3 lg:p-4 rounded-lg bg-amber-50 border border-amber-200"
                            data-testid="interior-shuruq-row"
                          >
                            <div className="flex items-center gap-2 lg:gap-3">
                              <SunriseIcon className="h-5 w-5 lg:h-6 lg:w-6 text-amber-500" />
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg lg:text-2xl text-amber-900">Shuruq</span>
                                <span className="text-xs lg:text-sm text-amber-700">(Sunrise)</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-base lg:text-2xl font-semibold text-amber-700">
                                {formatTime(sunrise)}
                              </div>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {prayerTimes.jummah && (
                    <div className="mt-4 p-4 bg-cyan-600 text-white rounded-lg" data-testid="interior-jummah-row">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 lg:h-6 lg:w-6" />
                          <span className="font-semibold text-lg lg:text-2xl">Jummah (Friday)</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-cyan-100 mb-0.5">Time</div>
                          <div className="font-mono text-base lg:text-2xl font-semibold">
                            {formatTime(prayerTimes.jummah.time)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT — Hero Carousel */}
        <div
          className="relative h-full bg-cyan-700/5 border-t lg:border-t-0 lg:border-l border-cyan-100"
          data-testid="interior-carousel-half"
        >
          <HeroCarousel onDonate={onDonate} onLocation={onLocation} />
        </div>
      </div>
    </div>
  );
};

export default InteriorPrayerTimes;
