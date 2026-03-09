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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal - Responsive sizing without internal scroll */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-xl lg:max-w-2xl animate-in fade-in zoom-in duration-300">
        {/* Close button - High z-index to stay above everything */}
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-[70] bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors border-2 border-gray-200"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        {/* Image */}
        <div className="relative">
          <img 
            src={popupSettings.image_path}
            alt="Support Our Masjid"
            className="w-full h-auto rounded-t-lg"
          />
        </div>

        {/* Call to action */}
        <div className="p-4 md:p-6 bg-gradient-to-br from-cyan-50 to-white rounded-b-lg">
          <h3 className="text-base md:text-xl lg:text-2xl font-bold text-gray-900 mb-2 md:mb-3 text-center">
            {popupSettings.title}
          </h3>
          <p className="text-xs md:text-sm lg:text-base text-gray-700 mb-3 md:mb-4 text-center">
            {popupSettings.description}
          </p>
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleDonate}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 md:py-4 text-sm md:text-base font-semibold"
            >
              Donate Now
            </Button>
          </div>

          <p className="text-[10px] md:text-xs text-gray-500 text-center mt-2 md:mt-3">
            {popupSettings.citation}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RamadanPopup;
