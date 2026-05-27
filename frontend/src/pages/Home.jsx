import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast, Toaster } from 'sonner';
import DonationModal from '../components/DonationModal';
import RamadanPopup from '../components/RamadanPopup';
import PrayerTimesCarousel from '../components/PrayerTimesCarousel';
import Header from '../components/sections/Header';
import HeroCarousel from '../components/sections/HeroCarousel';
import PrayerTimesSection from '../components/sections/PrayerTimesSection';
import MixlrSection from '../components/sections/MixlrSection';
import DonationSection from '../components/sections/DonationSection';
import AboutSection from '../components/sections/AboutSection';
import LocationSection from '../components/sections/LocationSection';
import ContactSection from '../components/sections/ContactSection';
import Footer from '../components/sections/Footer';
import { usePrayerTimes, usePrayerTimesByDate, useDonationGoal, useAnnouncements, usePopupSettings, getDonationStatus } from '../services/api';
import { mosqueInfo, donationInfo, aboutContent } from '../data/mock';

const Home = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [donationModalOpen, setDonationModalOpen] = useState(false);

  // Use SWR hooks for automatic caching and revalidation
  const { prayerTimes, isLoading: prayerLoading, isError: prayerError, mutate: mutatePrayerTimes } = usePrayerTimes();
  // Pre-fetch tomorrow's prayer times for per-prayer rollover after Iqamah
  const tomorrowIso = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();
  const { prayerTimes: tomorrowPrayers } = usePrayerTimesByDate(tomorrowIso);

  // Build a rolled-over prayer times object for display: any prayer whose
  // today Iqamah has passed shows tomorrow's adhan/iqamah instead.
  const rolledPrayerTimes = (() => {
    if (!prayerTimes?.prayers) return prayerTimes;
    const minutesNow = currentTime.getHours() * 60 + currentTime.getMinutes() + currentTime.getSeconds() / 60;
    const tomorrowByName = {};
    if (tomorrowPrayers?.prayers) {
      for (const p of tomorrowPrayers.prayers) tomorrowByName[p.name] = p;
    }
    const newPrayers = prayerTimes.prayers.map((p) => {
      const [h, m] = (p.iqamah || '00:00').split(':').map(Number);
      if (Number.isNaN(h) || Number.isNaN(m)) return p;
      if (h * 60 + m < minutesNow && tomorrowByName[p.name]) {
        return { ...p, adhan: tomorrowByName[p.name].adhan, iqamah: tomorrowByName[p.name].iqamah };
      }
      return p;
    });
    let nextSunrise = prayerTimes.sunrise;
    if (prayerTimes.sunrise && prayerTimes.sunrise !== 'N/A') {
      const [sh, sm] = prayerTimes.sunrise.split(':').map(Number);
      if (sh * 60 + sm < minutesNow && tomorrowPrayers?.sunrise && tomorrowPrayers.sunrise !== 'N/A') {
        nextSunrise = tomorrowPrayers.sunrise;
      }
    }
    return { ...prayerTimes, prayers: newPrayers, sunrise: nextSunrise };
  })();
  const { donationGoal, isLoading: goalLoading, isError: goalError } = useDonationGoal();
  const { announcements, announcementsEnabled } = useAnnouncements();
  const { popupSettings } = usePopupSettings();

  // Scroll to top on page load - multiple methods for reliability
  useEffect(() => {
    // Method 1: Immediate scroll
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Method 2: Disable scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // Method 3: Delayed scroll (after content loads)
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []); // Empty dependency is correct - we want this to run once and update continuously

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
    window.open('https://pay.sumup.com/b2c/QHK4XJ9T', '_blank');
  };

  // Just show loading state briefly, then show the site even without prayer times
  if (prayerLoading && !prayerTimes) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" richColors />
      
      {/* Ramadan Fundraising Popup */}
      <RamadanPopup onDonate={handleDonate} popupSettings={popupSettings} />

      {/* Header */}
      <Header mosqueInfo={mosqueInfo} onDonate={handleDonate} />

      {/* Prayer Times Carousel (just under header) */}
      <PrayerTimesCarousel 
        prayerTimes={prayerTimes} 
        formatTime={formatTime}
        getNextPrayer={getNextPrayer}
        announcements={announcements}
        announcementsEnabled={announcementsEnabled}
      />

      {/* Hero Carousel */}
      <HeroCarousel
        onDonate={handleDonate}
        onLocation={() => document.querySelector('#location')?.scrollIntoView({ behavior: 'smooth' })}
      />

      {/* Prayer Times Section */}
      <PrayerTimesSection 
        prayerTimes={rolledPrayerTimes} 
        getNextPrayer={getNextPrayer} 
        formatTime={formatTime} 
      />

      {/* Mixlr Live Stream Section */}
      <MixlrSection />

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
