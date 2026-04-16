import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { MapPin, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHeroCards, useHeroSettings } from '../../services/api';

const HeroCarousel = ({ onDonate, onLocation }) => {
  const { cards, isLoading } = useHeroCards();
  const { carouselEnabled, scrollInterval } = useHeroSettings();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Default hero card (original content)
  const defaultCard = {
    id: 'default',
    title: 'Welcome',
    content_type: 'default',
    order: 0
  };

  // Combine default card with custom cards when carousel is enabled
  const allCards = carouselEnabled ? [defaultCard, ...cards] : [defaultCard];

  // Auto-scroll functionality
  useEffect(() => {
    if (!carouselEnabled || allCards.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allCards.length);
    }, scrollInterval);

    return () => clearInterval(interval);
  }, [carouselEnabled, allCards.length, scrollInterval]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % allCards.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + allCards.length) % allCards.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Extract YouTube video ID from URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[7].length === 11) ? match[7] : null;
    
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : null;
  };

  // Render card content based on type
  const renderCardContent = (card) => {
    if (card.content_type === 'default') {
      return (
        <div className="relative bg-gradient-to-br from-cyan-50 to-white py-8 sm:py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto text-center">
              {/* Logo */}
              <div className="mb-4 sm:mb-6 flex justify-center">
                <img
                  src="https://customer-assets.emergentagent.com/job_markaz-rahma-1/artifacts/s5521pmg_Untitled%20design.png"
                  alt="Markaz Al-Rahma Logo"
                  className="h-16 sm:h-20 md:h-24 w-auto object-contain"
                />
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 sm:mb-4">
                Markaz Al-Rahma
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
                A Community Center in the Heart of Colindale, London
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
                <Button
                  onClick={onDonate}
                  className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Heart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Donate Now
                </Button>

                <Button
                  onClick={onLocation}
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200"
                >
                  <MapPin className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Visit Us
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (card.content_type === 'video') {
      const embedUrl = getYouTubeEmbedUrl(card.content_url);
      return (
        <div className="relative bg-gradient-to-br from-cyan-50 to-white py-8 sm:py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              {card.title && (
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
                  {card.title}
                </h2>
              )}
              {embedUrl ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                    src={embedUrl}
                    title={card.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="bg-gray-200 rounded-lg h-64 sm:h-96 flex items-center justify-center">
                  <p className="text-gray-500">Invalid video URL</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (card.content_type === 'image') {
      return (
        <div className="relative bg-gradient-to-br from-cyan-50 to-white py-8 sm:py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              {card.title && (
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
                  {card.title}
                </h2>
              )}
              <div className="relative rounded-lg overflow-hidden shadow-lg">
                <img
                  src={card.content_url}
                  alt={card.title}
                  className="w-full h-auto object-cover"
                  style={{ maxHeight: '500px' }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="relative bg-gradient-to-br from-cyan-50 to-white py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const currentCard = allCards[currentIndex];

  return (
    <div className="relative">
      {/* Card Content */}
      <div className="transition-all duration-500">
        {renderCardContent(currentCard)}
      </div>

      {/* Navigation Arrows - Only show if carousel enabled and has multiple cards */}
      {carouselEnabled && allCards.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 sm:p-3 rounded-full shadow-lg hover:shadow-xl transition-all z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 sm:p-3 rounded-full shadow-lg hover:shadow-xl transition-all z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </>
      )}

      {/* Dots Indicator - Only show if carousel enabled and has multiple cards */}
      {carouselEnabled && allCards.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {allCards.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 sm:h-2.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-6 sm:w-8 bg-cyan-600'
                  : 'w-2 sm:w-2.5 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;
