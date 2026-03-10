import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Radio, Play } from 'lucide-react';

const MixlrSection = () => {
  const [isLive, setIsLive] = useState(false);
  const defaultThumbnail = 'https://customer-assets.emergentagent.com/job_markaz-rahma-1/artifacts/ieynnwvy_ON%20-%203.jpeg';

  // Check if live by trying to detect iframe content (Mixlr updates the embed when live)
  useEffect(() => {
    // This is a simple check - in production you might want to use Mixlr's API
    // For now, we'll show the default state
    const checkLiveStatus = () => {
      // You can implement actual live detection here if Mixlr provides an API
      // For now, this is a placeholder
    };
    
    checkLiveStatus();
  }, []);

  return (
    <section id="mixlr-live" className="py-8 md:py-12 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Radio className="h-5 w-5 md:h-6 md:w-6 text-cyan-600" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Live Stream
              </h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base">
              Listen to our live lectures and programs
            </p>
          </div>

          {/* Mixlr Embed Card */}
          <Card className="shadow-xl overflow-hidden border-2 border-cyan-100">
            <CardContent className="p-0">
              {/* Live Status Banner */}
              <div className={`py-2 px-4 text-center font-semibold text-xs md:text-sm ${
                isLive 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse' 
                  : 'bg-gray-800 text-gray-300'
              }`}>
                {isLive ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="relative flex h-2 w-2 md:h-3 md:w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 md:h-3 md:w-3 bg-white"></span>
                    </span>
                    <span>🔴 LIVE NOW</span>
                  </div>
                ) : (
                  <span>⚫ Offline - Check back later for live streams</span>
                )}
              </div>

              {/* Thumbnail or Embed */}
              <div className="relative bg-gray-900">
                {!isLive ? (
                  <div className="relative w-full">
                    <img 
                      src={defaultThumbnail} 
                      alt="Mixlr Stream" 
                      className="w-full h-auto object-contain"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Play className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-2 md:mb-3 opacity-80" />
                        <p className="text-base md:text-lg font-semibold">Currently Offline</p>
                        <p className="text-xs md:text-sm opacity-90">Tune in when we go live</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video">
                    <iframe 
                      src="https://markazrahma.mixlr.com/embed" 
                      frameBorder="0" 
                      scrolling="no" 
                      className="w-full h-full"
                      title="Mixlr Live Stream"
                    />
                  </div>
                )}
              </div>

              {/* Mixlr Attribution */}
              <div className="bg-gray-50 py-1.5 px-3 border-t border-gray-200">
                <a 
                  href="https://mixlr.com/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-600 hover:text-cyan-600 transition-colors"
                >
                  Powered by Mixlr
                </a>
              </div>

              {/* View Recordings Button */}
              <div className="p-3 md:p-4 bg-white border-t border-gray-200">
                <Button 
                  onClick={() => window.location.href = 'https://markazrahma.mixlr.com/recordings'}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-4 md:py-5 text-sm md:text-base font-semibold"
                >
                  <Play className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  View All Recordings
                </Button>
                
                {/* Info Text - Now inside card */}
                <p className="text-center text-xs md:text-sm text-gray-500 mt-2 md:mt-3">
                  Listen to past lectures and programs on our recordings page
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default MixlrSection;
