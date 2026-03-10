import React, { useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from './ui/card';

const PrayerTimesCarousel = ({ prayerTimes, formatTime, getNextPrayer, announcements = [], announcementsEnabled = false }) => {
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);

  // Auto-rotate announcements every 5 seconds if there's more than one
  useEffect(() => {
    if (!announcementsEnabled || announcements.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [announcements.length, announcementsEnabled]);

  if (!prayerTimes) return null;

  const nextPrayer = getNextPrayer();
  const activeAnnouncements = announcements.filter(a => a.enabled);

  return (
    <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 shadow-md">
      <div className="container mx-auto px-2 md:px-4 py-3 md:py-4">
        {/* Prayer Times Row - Mobile Only */}
        <div className="md:hidden flex items-center justify-center gap-1 overflow-x-auto pb-3">
          {prayerTimes.prayers.map((prayer, index) => {
            const isNext = prayer.name === nextPrayer;
            return (
              <div
                key={index}
                className={`flex flex-col items-center min-w-[80px] px-2 py-2 ${
                  isNext ? 'scale-110' : ''
                } transition-all`}
              >
                <div className="flex items-center gap-1 mb-1">
                  {isNext && <Clock className="h-3 w-3 text-yellow-300" />}
                  <span className={`text-sm font-bold ${isNext ? 'text-yellow-300' : 'text-white'}`}>
                    {prayer.name}
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-cyan-100 font-medium">Adhan</div>
                  <div className={`font-mono text-sm font-bold ${isNext ? 'text-yellow-300' : 'text-white'}`}>
                    {formatTime(prayer.adhan)}
                  </div>
                </div>
                <div className="text-center mt-1">
                  <div className="text-[10px] text-cyan-100 font-medium">Iqamah</div>
                  <div className={`font-mono text-sm font-bold ${isNext ? 'text-yellow-300' : 'text-cyan-100'}`}>
                    {formatTime(prayer.iqamah)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Announcements Section - Both Mobile and Desktop */}
        {announcementsEnabled && activeAnnouncements.length > 0 && (
          <div className="md:border-t-0 border-t border-cyan-500 md:pt-0 pt-4">
            <div className="flex items-center justify-center gap-3 md:gap-4 py-2">
              {activeAnnouncements.length > 1 && (
                <button
                  onClick={() => setCurrentAnnouncementIndex((prev) => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length)}
                  className="text-white hover:text-yellow-300 transition-colors flex-shrink-0"
                  aria-label="Previous announcement"
                >
                  <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" />
                </button>
              )}
              <div 
                className={`flex-1 text-center px-3 md:px-4 ${activeAnnouncements[currentAnnouncementIndex]?.url ? 'cursor-pointer hover:text-yellow-300 transition-colors' : ''}`}
                onClick={() => {
                  const url = activeAnnouncements[currentAnnouncementIndex]?.url;
                  if (url) {
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                <p className="text-white text-base md:text-xl lg:text-2xl font-semibold leading-relaxed">
                  📢 {activeAnnouncements[currentAnnouncementIndex]?.text}
                  {activeAnnouncements[currentAnnouncementIndex]?.url && (
                    <span className="ml-2 text-yellow-300">🔗</span>
                  )}
                </p>
              </div>
              {activeAnnouncements.length > 1 && (
                <button
                  onClick={() => setCurrentAnnouncementIndex((prev) => (prev + 1) % activeAnnouncements.length)}
                  className="text-white hover:text-yellow-300 transition-colors flex-shrink-0"
                  aria-label="Next announcement"
                >
                  <ChevronRight className="h-6 w-6 md:h-7 md:w-7" />
                </button>
              )}
            </div>
            {activeAnnouncements.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3 pb-2">
                {activeAnnouncements.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentAnnouncementIndex(index)}
                    className={`h-2 md:h-2.5 rounded-full transition-all ${
                      index === currentAnnouncementIndex
                        ? 'w-6 md:w-8 bg-yellow-300'
                        : 'w-2 md:w-2.5 bg-cyan-400 hover:bg-cyan-300'
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
