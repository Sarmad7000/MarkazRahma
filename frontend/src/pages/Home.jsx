import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast, Toaster } from 'sonner';
import DonationModal from '../components/DonationModal';
import RamadanPopup from '../components/RamadanPopup';
import Header from '../components/sections/Header';
import HeroSection from '../components/sections/HeroSection';
import PrayerTimesSection from '../components/sections/PrayerTimesSection';
import DonationSection from '../components/sections/DonationSection';
import AboutSection from '../components/sections/AboutSection';
import LocationSection from '../components/sections/LocationSection';
import ContactSection from '../components/sections/ContactSection';
import Footer from '../components/sections/Footer';
import { usePrayerTimes, useDonationGoal, getDonationStatus } from '../services/api';
import { mosqueInfo, donationInfo, aboutContent } from '../data/mock';

const Home = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [donationModalOpen, setDonationModalOpen] = useState(false);

  // Use SWR hooks for automatic caching and revalidation
  const { prayerTimes, isLoading: prayerLoading, isError: prayerError } = usePrayerTimes();
  const { donationGoal, isLoading: goalLoading, isError: goalError } = useDonationGoal();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    checkPaymentStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPaymentStatus = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const donationStatus = urlParams.get('donation');

    if (donationStatus === 'cancelled') {
      toast.error('Donation was cancelled');
      window.history.replaceState({}, '', '/');
      return;
    }

    if (sessionId) {
      toast.info('Checking payment status...');
      pollPaymentStatus(sessionId);
    }
  };

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    
    if (attempts >= maxAttempts) {
      toast.error('Payment verification timed out. Please contact us if you made a payment.');
      window.history.replaceState({}, '', '/');
      return;
    }

    try {
      const status = await getDonationStatus(sessionId);
      
      if (status.payment_status === 'paid') {
        toast.success('Payment successful! Thank you for your generous donation.');
        window.history.replaceState({}, '', '/');
        return;
      } else if (status.status === 'expired') {
        toast.error('Payment session expired. Please try again.');
        window.history.replaceState({}, '', '/');
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast.error('Failed to verify payment status');
      window.history.replaceState({}, '', '/');
    }
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getNextPrayer = () => {
    if (!prayerTimes) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const prayer of prayerTimes.prayers) {
      const [hours, minutes] = prayer.iqamah.split(':').map(Number);
      const prayerTime = hours * 60 + minutes;
      
      if (prayerTime > currentTime) {
        return prayer.name;
      }
    }
    
    // If no prayer found today, next is Fajr tomorrow
    return prayerTimes.prayers[0]?.name;
  };

  const handleDonate = () => {
    window.open('https://checkout.square.site/merchant/MLSD6EY5CMY2P/checkout/HXF33WVBEFWIA65YBXUQST3B?src=sheet', '_blank');
  };

  // Show error state if prayer times fail to load
  if (prayerError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-amber-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Prayer Times Temporarily Unavailable</h2>
          <p className="text-gray-600 mb-4">
            We're having trouble loading the prayer times. Please check back in a few minutes.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (prayerLoading && !prayerTimes) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading prayer times...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" richColors />
      
      {/* Ramadan Fundraising Popup */}
      <RamadanPopup onDonate={handleDonate} />

      {/* Header */}
      <Header mosqueInfo={mosqueInfo} onDonate={handleDonate} />

      {/* Hero Section */}
      <HeroSection mosqueInfo={mosqueInfo} onDonate={handleDonate} />

      {/* Prayer Times Section */}
      <PrayerTimesSection 
        prayerTimes={prayerTimes} 
        getNextPrayer={getNextPrayer} 
        formatTime={formatTime} 
      />

      {/* Donation Section */}
      <DonationSection donationInfo={donationInfo} donationGoal={donationGoal} />

      {/* About Section */}
      <AboutSection aboutContent={aboutContent} />

      {/* Location Section */}
      <LocationSection mosqueInfo={mosqueInfo} />

      {/* Contact Section */}
      <ContactSection mosqueInfo={mosqueInfo} />

      {/* Footer */}
      <Footer mosqueInfo={mosqueInfo} />

      {/* Donation Modal */}
      <DonationModal open={donationModalOpen} onClose={() => setDonationModalOpen(false)} />
    </div>
  );
};

export default Home;
