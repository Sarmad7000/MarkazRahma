import React, { useState } from 'react';
import { Heart, Menu, X } from 'lucide-react';
import { Button } from '../ui/button';

const Header = ({ mosqueInfo, onDonate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-3 md:px-4 py-2 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4 w-auto md:w-64">
            <img 
              src="https://customer-assets.emergentagent.com/job_markaz-rahma-1/artifacts/q7pgbb1k_Untitled%20design%20%2848%29.png" 
              alt="Markaz Al-Rahma Logo" 
              className="h-6 md:h-10 w-auto"
            />
            <div>
              <h1 className="text-base md:text-xl font-bold text-gray-900 whitespace-nowrap">{mosqueInfo.name}</h1>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
            <a href="/#prayer-times" className="text-gray-700 hover:text-cyan-600 transition-colors whitespace-nowrap">Prayer Times</a>
            <a href="/timetable" className="text-gray-700 hover:text-cyan-600 transition-colors whitespace-nowrap">Prayer Timetable</a>
            <a href="/events" className="text-gray-700 hover:text-cyan-600 transition-colors whitespace-nowrap">Events</a>
            <a href="https://markazrahma.mixlr.com/recordings" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-cyan-600 transition-colors whitespace-nowrap">Mixlr Recordings</a>
            <a href="/#donate" className="text-gray-700 hover:text-cyan-600 transition-colors whitespace-nowrap">Donate</a>
            <a href="/#about" className="text-gray-700 hover:text-cyan-600 transition-colors whitespace-nowrap">About</a>
            <a href="/#contact" className="text-gray-700 hover:text-cyan-600 transition-colors whitespace-nowrap">Contact</a>
          </nav>
          
          {/* Desktop Donate Button */}
          <div className="w-64 flex justify-end">
            <Button onClick={onDonate} className="bg-cyan-600 hover:bg-cyan-700 text-white hidden md:flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Donate Now
            </Button>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-cyan-600"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <nav className="flex flex-col space-y-3">
              <a 
                href="/#prayer-times" 
                className="text-gray-700 hover:text-cyan-600 transition-colors py-2 px-4 rounded hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Prayer Times
              </a>
              <a 
                href="/timetable" 
                className="text-gray-700 hover:text-cyan-600 transition-colors py-2 px-4 rounded hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Prayer Timetable
              </a>
              <a 
                href="/events" 
                className="text-gray-700 hover:text-cyan-600 transition-colors py-2 px-4 rounded hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Events
              </a>
              <a 
                href="https://markazrahma.mixlr.com/recordings"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-cyan-600 transition-colors py-2 px-4 rounded hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Mixlr Recordings
              </a>
              <a 
                href="/#donate" 
                className="text-gray-700 hover:text-cyan-600 transition-colors py-2 px-4 rounded hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Donate
              </a>
              <a 
                href="/#about" 
                className="text-gray-700 hover:text-cyan-600 transition-colors py-2 px-4 rounded hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
              <a 
                href="/#contact" 
                className="text-gray-700 hover:text-cyan-600 transition-colors py-2 px-4 rounded hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
              <Button 
                onClick={() => {
                  onDonate();
                  setMobileMenuOpen(false);
                }}
                className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center gap-2 w-full"
              >
                <Heart className="h-4 w-4" />
                Donate Now
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
