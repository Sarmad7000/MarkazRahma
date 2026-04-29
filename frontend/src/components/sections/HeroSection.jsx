import React from 'react';
import { Heart, MapPin } from 'lucide-react';
import { Button } from '../ui/button';

const HeroSection = ({ mosqueInfo, onDonate }) => {
  return (
    <section className="relative bg-gradient-to-b from-cyan-50 to-white py-10 md:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-3 md:mb-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_markaz-rahma-1/artifacts/hk0234u7_Untitled%20design%20%2848%29.png" 
              alt="Decorative element" 
              className="h-24 md:h-32 lg:h-40 w-auto mx-auto"
            />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 mt-3 md:mt-4">
            {mosqueInfo.fullName}
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto">
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
