import React from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

const PrayerTimesSection = ({ prayerTimes, getNextPrayer, formatTime }) => {
  if (!prayerTimes) return null;

  return (
    <section id="prayer-times" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Prayer Times</h2>
            <p className="text-gray-600">
              {new Date(prayerTimes.date).toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-cyan-600 font-medium">{prayerTimes.hijri_date}</p>
          </div>

          <Card className="shadow-lg border-t-4 border-t-cyan-600">
            <CardContent className="p-6">
              <div className="space-y-4">
                {prayerTimes.prayers.map((prayer, index) => {
                  const isNext = prayer.name === getNextPrayer();
                  return (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between p-3 md:p-4 rounded-lg transition-all ${
                        isNext 
                          ? 'bg-cyan-50 border-2 border-cyan-500 shadow-md' 
                          : 'bg-gray-50 hover:bg-cyan-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <Clock className={`h-4 w-4 md:h-5 md:w-5 ${isNext ? 'text-cyan-700' : 'text-cyan-600'}`} />
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-base md:text-lg ${isNext ? 'text-cyan-700' : 'text-gray-900'}`}>
                            {prayer.name}
                          </span>
                          {isNext && (
                            <span className="text-[10px] md:text-xs bg-cyan-600 text-white px-1.5 md:px-2 py-0.5 md:py-1 rounded-full whitespace-nowrap">
                              Next
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4 md:gap-8">
                        <div className="text-right">
                          <div className="text-[10px] md:text-xs text-gray-500 mb-0.5 md:mb-1">Adhan</div>
                          <div className={`font-mono text-sm md:text-lg font-semibold ${isNext ? 'text-cyan-700' : 'text-gray-900'}`}>
                            {formatTime(prayer.adhan)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] md:text-xs text-gray-500 mb-0.5 md:mb-1">Iqamah</div>
                          <div className={`font-mono text-sm md:text-lg font-semibold ${isNext ? 'text-cyan-700' : 'text-cyan-600'}`}>
                            {formatTime(prayer.iqamah)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {prayerTimes.jummah && (
                  <div className="mt-6 p-4 bg-cyan-600 text-white rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5" />
                        <span className="font-semibold text-lg">Jummah (Friday)</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-cyan-100 mb-1">Time</div>
                        <div className="font-mono text-lg font-semibold">{formatTime(prayerTimes.jummah.time)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PrayerTimesSection;
