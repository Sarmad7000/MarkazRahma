import React from 'react';
import { Heart, MapPin } from 'lucide-react';
import { Button } from '../ui/button';

const Header = ({ mosqueInfo, onDonate }) => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 w-64">
            <img 
              src="https://customer-assets.emergentagent.com/job_markaz-rahma-1/artifacts/s5521pmg_Untitled%20design.png" 
              alt="Markaz Al-Rahma Logo" 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{mosqueInfo.name}</h1>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
            <a href="#prayer-times" className="text-gray-700 hover:text-cyan-600 transition-colors whitespace-nowrap">Prayer Times</a>
            <a href="#donate" className="text-gray-700 hover:text-cyan-600 transition-colors whitespace-nowrap">Donate</a>
            <a href="#about" className="text-gray-700 hover:text-cyan-600 transition-colors whitespace-nowrap">About</a>
            <a href="#contact" className="text-gray-700 hover:text-cyan-600 transition-colors whitespace-nowrap">Contact</a>
          </nav>
          <div className="w-64 flex justify-end">
            <Button onClick={onDonate} className="bg-cyan-600 hover:bg-cyan-700 text-white hidden md:flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Donate Now
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
