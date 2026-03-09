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
      <div className="container mx-auto px-4 py-4">
        {/* Prayer Times Row */}
        <div className="flex items-center justify-center gap-3 md:gap-6 overflow-x-auto pb-2">
          {prayerTimes.prayers.map((prayer, index) => {
            const isNext = prayer.name === nextPrayer;
            return (
              <div
                key={index}
                className={`flex flex-col items-center min-w-[80px] md:min-w-[100px] ${
                  isNext ? 'scale-110' : ''
                } transition-all`}
              >
                <div className="flex items-center gap-1 mb-1">
                  {isNext && <Clock className="h-3 w-3 text-yellow-300" />}
                  <span className={`text-xs md:text-sm font-semibold ${isNext ? 'text-yellow-300' : 'text-white'}`}>
                    {prayer.name}
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-[10px] md:text-xs text-cyan-100">Adhan</div>
                  <div className={`font-mono text-sm md:text-base font-bold ${isNext ? 'text-yellow-300' : 'text-white'}`}>
                    {formatTime(prayer.adhan)}
                  </div>
                </div>
                <div className="text-center mt-1">
                  <div className="text-[10px] md:text-xs text-cyan-100">Iqamah</div>
                  <div className={`font-mono text-sm md:text-base font-bold ${isNext ? 'text-yellow-300' : 'text-cyan-100'}`}>
                    {formatTime(prayer.iqamah)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Announcements Section */}
        {announcementsEnabled && activeAnnouncements.length > 0 && (
          <div className="mt-3 pt-3 border-t border-cyan-500">
            <div className="flex items-center justify-center gap-3">
              {activeAnnouncements.length > 1 && (
                <button
                  onClick={() => setCurrentAnnouncementIndex((prev) => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length)}
                  className="text-white hover:text-yellow-300 transition-colors"
                  aria-label="Previous announcement"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <div className="flex-1 text-center">
                <p className="text-white text-sm md:text-base font-medium">
                  📢 {activeAnnouncements[currentAnnouncementIndex]?.text}
                </p>
              </div>
              {activeAnnouncements.length > 1 && (
                <button
                  onClick={() => setCurrentAnnouncementIndex((prev) => (prev + 1) % activeAnnouncements.length)}
                  className="text-white hover:text-yellow-300 transition-colors"
                  aria-label="Next announcement"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
            {activeAnnouncements.length > 1 && (
              <div className="flex justify-center gap-1 mt-2">
                {activeAnnouncements.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentAnnouncementIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentAnnouncementIndex
                        ? 'w-6 bg-yellow-300'
                        : 'w-2 bg-cyan-400 hover:bg-cyan-300'
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
