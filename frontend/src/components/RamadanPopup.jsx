import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../components/ui/button';

const RamadanPopup = ({ onDonate, popupSettings }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only show popup if enabled in settings
    if (!popupSettings || !popupSettings.enabled) return;
    
    // Show popup after 1 second delay on every page load
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [popupSettings]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDonate = () => {
    setIsOpen(false);
    onDonate();
  };

  if (!isOpen || !popupSettings || !popupSettings.enabled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 md:top-4 md:right-4 z-10 bg-white rounded-full p-3 md:p-2 shadow-lg hover:bg-gray-100 transition-colors touch-manipulation"
          aria-label="Close"
        >
          <X className="h-6 w-6 md:h-5 md:w-5 text-gray-600" />
        </button>

        {/* Image */}
        <div className="relative">
          <img 
            src={popupSettings.image_path}
            alt="Support Our Masjid"
            className="w-full h-auto"
          />
        </div>

        {/* Call to action */}
        <div className="p-4 md:p-6 bg-gradient-to-br from-cyan-50 to-white">
          <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 md:mb-3 text-center">
            {popupSettings.title}
          </h3>
          <p className="text-sm md:text-base text-gray-700 mb-4 md:mb-6 text-center">
            {popupSettings.description}
          </p>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleDonate}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-4 md:py-6 text-base md:text-lg font-semibold"
            >
              Donate Now
            </Button>
          </div>

          <p className="text-xs md:text-xs text-gray-500 text-center mt-3 md:mt-4">
            {popupSettings.citation}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RamadanPopup;
