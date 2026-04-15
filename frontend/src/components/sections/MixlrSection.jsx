import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Radio, Play } from 'lucide-react';
import { useMixlrStatus } from '../../services/api';

const MixlrSection = () => {
  const { isLive, isLoading } = useMixlrStatus();
  const defaultThumbnail = 'https://customer-assets.emergentagent.com/job_markaz-rahma-1/artifacts/ieynnwvy_ON%20-%203.jpeg';

  return (
    <section id="mixlr-live" className="py-6 md:py-8 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Radio className="h-4 w-4 md:h-5 md:w-5 text-cyan-600" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Live Stream
              </h2>
            </div>
            <p className="text-gray-600 text-xs md:text-sm">
              Listen to our live lectures and programs
            </p>
          </div>

          {/* Mixlr Embed Card */}
          <Card className="shadow-lg overflow-hidden border border-cyan-100">
            <CardContent className="p-0">
              {/* Live Status Banner */}
              <div className={`py-1.5 px-3 text-center font-semibold text-xs ${
                isLive 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse' 
                  : 'bg-gray-800 text-gray-300'
              }`}>
                {isLive ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span>🔴 LIVE NOW</span>
                  </div>
                ) : (
                  <span>⚫ Offline</span>
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
                        <Play className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-80" />
                        <p className="text-sm md:text-base font-semibold">Currently Offline</p>
                        <p className="text-xs opacity-90">Tune in when we go live</p>
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
              <div className="bg-gray-50 py-1 px-2 border-t border-gray-200">
                <a 
                  href="https://mixlr.com/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-gray-600 hover:text-cyan-600 transition-colors"
                >
                  Powered by Mixlr
                </a>
              </div>

              {/* View Recordings Button */}
              <div className="p-2.5 md:p-3 bg-white border-t border-gray-200">
                <Button 
                  onClick={() => window.location.href = 'https://markazrahma.mixlr.com/recordings'}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 md:py-4 text-xs md:text-sm font-semibold"
                >
                  <Play className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
                  View All Recordings
                </Button>
                
                {/* Info Text - Now inside card */}
                <p className="text-center text-[10px] md:text-xs text-gray-500 mt-2">
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
