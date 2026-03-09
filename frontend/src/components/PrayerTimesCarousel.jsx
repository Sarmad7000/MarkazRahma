import React, { useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from './ui/card';

const PrayerTimesCarousel = ({ prayerTimes, formatTime, getNextPrayer, announcements = [], announcementsEnabled = false }) => {
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);

  // Auto-rotate announcements every 10 seconds
  useEffect(() => {
    if (!announcementsEnabled || !announcements.length) return;
    
    const interval = setInterval(() => {
      setCurrentAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [announcements.length, announcementsEnabled]);

  if (!prayerTimes) return null;

  const nextPrayer = getNextPrayer();
  const activeAnnouncements = announcements.filter(a => a.enabled);

  return (
    <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 shadow-md">
      <div className="container mx-auto px-2 md:px-4 py-3 md:py-4">
        {/* Prayer Times Row - Mobile Only */}
        <div className="md:hidden flex items-center justify-center gap-1 overflow-x-auto pb-2">
          {prayerTimes.prayers.map((prayer, index) => {
            const isNext = prayer.name === nextPrayer;
            return (
              <div
                key={index}
                className={`flex flex-col items-center min-w-[70px] ${
                  isNext ? 'scale-105' : ''
                } transition-all`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  {isNext && <Clock className="h-2.5 w-2.5 text-yellow-300" />}
                  <span className={`text-xs font-semibold ${isNext ? 'text-yellow-300' : 'text-white'}`}>
                    {prayer.name}
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-cyan-100">Adhan</div>
                  <div className={`font-mono text-xs font-bold ${isNext ? 'text-yellow-300' : 'text-white'}`}>
                    {formatTime(prayer.adhan)}
                  </div>
                </div>
                <div className="text-center mt-0.5">
                  <div className="text-[9px] text-cyan-100">Iqamah</div>
                  <div className={`font-mono text-xs font-bold ${isNext ? 'text-yellow-300' : 'text-cyan-100'}`}>
                    {formatTime(prayer.iqamah)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Announcements Section - Both Mobile and Desktop */}
        {announcementsEnabled && activeAnnouncements.length > 0 && (
          <div className="md:border-t-0 border-t border-cyan-500 md:pt-0 pt-2">
            <div className="flex items-center justify-center gap-2 md:gap-3">
              {activeAnnouncements.length > 1 && (
                <button
                  onClick={() => setCurrentAnnouncementIndex((prev) => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length)}
                  className="text-white hover:text-yellow-300 transition-colors"
                  aria-label="Previous announcement"
                >
                  <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              )}
              <div className="flex-1 text-center">
                <p className="text-white text-xs md:text-base font-medium px-2">
                  📢 {activeAnnouncements[currentAnnouncementIndex]?.text}
                </p>
              </div>
              {activeAnnouncements.length > 1 && (
                <button
                  onClick={() => setCurrentAnnouncementIndex((prev) => (prev + 1) % activeAnnouncements.length)}
                  className="text-white hover:text-yellow-300 transition-colors"
                  aria-label="Next announcement"
                >
                  <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              )}
            </div>
            {activeAnnouncements.length > 1 && (
              <div className="flex justify-center gap-1 mt-2">
                {activeAnnouncements.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentAnnouncementIndex(index)}
                    className={`h-1.5 md:h-2 rounded-full transition-all ${
                      index === currentAnnouncementIndex
                        ? 'w-4 md:w-6 bg-yellow-300'
                        : 'w-1.5 md:w-2 bg-cyan-400 hover:bg-cyan-300'
                    }`}
                    aria-label={`Go to announcement ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrayerTimesCarousel;
