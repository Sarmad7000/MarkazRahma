import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../components/ui/button';

const RamadanPopup = ({ onDonate }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the popup in this session
    const dismissed = sessionStorage.getItem('ramadan_popup_dismissed');
    
    if (!dismissed) {
      // Show popup after 1 second delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Remember dismissal for this session only
    sessionStorage.setItem('ramadan_popup_dismissed', 'true');
  };

  const handleDonate = () => {
    setIsOpen(false);
    sessionStorage.setItem('ramadan_popup_dismissed', 'true');
    onDonate();
  };

  if (!isOpen) return null;

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
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        {/* Image */}
        <div className="relative">
          <img 
            src="https://customer-assets.emergentagent.com/job_markaz-rahma-1/artifacts/1w25b3eq_OUR%20LAST%20RAMADAN%20IN%20COLINDALE%20%282%29.png"
            alt="Road to 100K - Support Our Masjid"
            className="w-full h-auto"
          />
        </div>

        {/* Call to action */}
        <div className="p-6 bg-gradient-to-br from-cyan-50 to-white">
          <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
            Our Last Ramadan in Colindale
          </h3>
          <p className="text-gray-700 mb-6 text-center">
            Help us reach our goal of £100,000 to relocate before Ramadan ends. 
            Every donation brings us closer to a permanent home for our community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleDonate}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-6 text-lg font-semibold"
            >
              Donate Now
            </Button>
            <Button 
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-gray-300 py-6 text-lg"
            >
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            "Whoever builds a mosque for Allah, Allah will build for him a house like it in Paradise."
            <br />
            <span className="text-gray-400">- Sahih Al-Bukhari 450, Sahih Muslim 533</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RamadanPopup;
