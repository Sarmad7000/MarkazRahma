import React from 'react';
import { Heart, MapPin } from 'lucide-react';
import { Button } from '../ui/button';

const HeroSection = ({ mosqueInfo, onDonate }) => {
  return (
    <section className="relative bg-gradient-to-b from-cyan-50 to-white py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6">
            <img 
              src="https://customer-assets.emergentagent.com/job_markaz-rahma-1/artifacts/hk0234u7_Untitled%20design%20%2848%29.png" 
              alt="Decorative element" 
              className="h-8 md:h-12 w-auto mx-auto mb-6"
            />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {mosqueInfo.fullName}
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {mosqueInfo.description}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button onClick={onDonate} size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Heart className="h-5 w-5 mr-2" />
              Support Our Expansion
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-cyan-600 text-cyan-600 hover:bg-cyan-50"
              onClick={() => document.querySelector('#location')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <MapPin className="h-5 w-5 mr-2" />
              Visit Us
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
