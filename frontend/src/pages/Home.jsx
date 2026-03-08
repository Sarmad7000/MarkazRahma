import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Heart, Mail, Twitter, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast, Toaster } from 'sonner';
import DonationProgress from '../components/DonationProgress';
import DonationModal from '../components/DonationModal';
import { getPrayerTimes, getDonationStatus, getDonationGoal } from '../services/api';
import { mosqueInfo, donationInfo, aboutContent } from '../data/mock';

const Home = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [donationGoal, setDonationGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donationModalOpen, setDonationModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchPrayerTimes();
    fetchDonationGoal();
    checkPaymentStatus();
  }, []);

  const fetchPrayerTimes = async () => {
    try {
      const data = await getPrayerTimes();
      setPrayerTimes(data);
    } catch (error) {
      console.error('Failed to fetch prayer times:', error);
      toast.error('Failed to load prayer times');
    } finally {
      setLoading(false);
    }
  };

  const fetchDonationGoal = async () => {
    try {
      const data = await getDonationGoal();
      setDonationGoal(data);
    } catch (error) {
      console.error('Failed to fetch donation goal:', error);
    }
  };

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
        // Refresh donation goal
        fetchDonationGoal();
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
    setDonationModalOpen(true);
  };

  if (loading) {
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
      {/* Header */}
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
              <Button onClick={handleDonate} className="bg-cyan-600 hover:bg-cyan-700 text-white hidden md:flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Donate Now
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-cyan-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-6">
              <div className="w-20 h-1 bg-cyan-600 mx-auto mb-6"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Welcome to {mosqueInfo.fullName}
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {mosqueInfo.description}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button onClick={handleDonate} size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white">
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

      {/* Prayer Times Section */}
      <section id="prayer-times" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Prayer Times</h2>
              {prayerTimes && (
                <>
                  <p className="text-gray-600">
                    {new Date(prayerTimes.date).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-cyan-600 font-medium">{prayerTimes.hijri_date}</p>
                </>
              )}
            </div>

            <Card className="shadow-lg border-t-4 border-t-cyan-600">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {prayerTimes?.prayers.map((prayer, index) => {
                    const isNext = prayer.name === getNextPrayer();
                    return (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                          isNext 
                            ? 'bg-cyan-50 border-2 border-cyan-500 shadow-md' 
                            : 'bg-gray-50 hover:bg-cyan-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className={`h-5 w-5 ${isNext ? 'text-cyan-700' : 'text-cyan-600'}`} />
                          <div>
                            <span className={`font-semibold text-lg ${isNext ? 'text-cyan-700' : 'text-gray-900'}`}>
                              {prayer.name}
                            </span>
                            {isNext && (
                              <span className="ml-2 text-xs bg-cyan-600 text-white px-2 py-1 rounded-full">
                                Next
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-8">
                          <div className="text-right">
                            <div className="text-xs text-gray-500 mb-1">Adhan</div>
                            <div className={`font-mono text-lg font-semibold ${isNext ? 'text-cyan-700' : 'text-gray-900'}`}>
                              {formatTime(prayer.adhan)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500 mb-1">Iqamah</div>
                            <div className={`font-mono text-lg font-semibold ${isNext ? 'text-cyan-700' : 'text-cyan-600'}`}>
                              {formatTime(prayer.iqamah)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Jummah */}
                  {prayerTimes?.jummah && (
                    <div className="mt-6 p-4 bg-cyan-600 text-white rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5" />
                          <span className="font-semibold text-lg">Jummah (Friday)</span>
                        </div>
                        <div className="flex gap-8">
                          <div className="text-right">
                            <div className="text-xs text-cyan-100 mb-1">Khutbah</div>
                            <div className="font-mono text-lg font-semibold">{formatTime(prayerTimes.jummah.khutbah)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-cyan-100 mb-1">Salah</div>
                            <div className="font-mono text-lg font-semibold">{formatTime(prayerTimes.jummah.salah)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section id="donate" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Heart className="h-12 w-12 text-cyan-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{donationInfo.title}</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">{donationInfo.message}</p>
            </div>

            {/* Donation Progress Tracker */}
            {donationGoal && (
              <div className="mb-8">
                <DonationProgress goal={donationGoal} />
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              {/* Online Donation */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-br from-cyan-600 to-cyan-700 text-white">
                  <CardTitle>Online Donation</CardTitle>
                  <CardDescription className="text-cyan-50">Quick and secure payment</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Button onClick={handleDonate} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-6 text-lg">
                      <Heart className="mr-2 h-5 w-5" />
                      Donate Now
                    </Button>
                    <p className="text-xs text-gray-500 text-center mt-4">
                      All donations are used for mosque expansion and community services. May Allah reward you.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Bank Transfer */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-br from-gray-800 to-gray-900 text-white">
                  <CardTitle>Bank Transfer</CardTitle>
                  <CardDescription className="text-gray-300">Direct bank deposit</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Account Name</div>
                      <div className="font-semibold text-gray-900">{donationInfo.bankTransfer.accountName}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Sort Code</div>
                        <div className="font-mono font-semibold text-gray-900">{donationInfo.bankTransfer.sortCode}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Account Number</div>
                        <div className="font-mono font-semibold text-gray-900">{donationInfo.bankTransfer.accountNumber}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Bank Type</div>
                      <div className="font-semibold text-gray-900">{donationInfo.bankTransfer.bankType}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">About Us</h2>
              <p className="text-lg text-gray-600 mb-6">{aboutContent.mission}</p>
              <p className="text-gray-600">{aboutContent.vision}</p>
            </div>

            {/* Values */}
            <div className="grid md:grid-cols-2 gap-6">
              {aboutContent.values.map((value, index) => (
                <Card key={index} className="border-l-4 border-l-cyan-600 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-cyan-600 text-center">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section id="location" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <MapPin className="h-12 w-12 text-cyan-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Visit Us</h2>
              <p className="text-lg text-gray-600">{mosqueInfo.location.address}</p>
            </div>

            <Card className="shadow-lg overflow-hidden">
              <div className="h-96 w-full">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2476.8!2d-0.2507!3d51.5906!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487618c3a1e7e9e3%3A0x1234567890!2s15a%20Carlisle%20Rd%2C%20London%20NW9%200HD!5e0!3m2!1sen!2suk!4v1234567890!5m2!1sen!2suk"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Markaz Al-Rahma Location"
                ></iframe>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600">Get in touch with our community</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Mail className="h-10 w-10 text-cyan-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                  <p className="text-gray-600">{mosqueInfo.contact.email}</p>
                </CardContent>
              </Card>

              <Card className="text-center shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Twitter className="h-10 w-10 text-cyan-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Twitter</h3>
                  <a 
                    href={mosqueInfo.social.twitterUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-cyan-600 hover:text-cyan-700"
                  >
                    {mosqueInfo.social.twitter}
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <div className="h-16 w-auto mx-auto mb-4 flex justify-center items-center bg-white rounded-lg p-2" style={{ width: 'fit-content' }}>
                <img 
                  src="https://customer-assets.emergentagent.com/job_markaz-rahma-1/artifacts/s5521pmg_Untitled%20design.png" 
                  alt="Markaz Al-Rahma Logo" 
                  className="h-14 w-auto"
                />
              </div>
              <h3 className="text-2xl font-bold mb-2">{mosqueInfo.name}</h3>
            </div>
            
            <div className="border-t border-gray-800 pt-6">
              <p className="text-gray-400 text-sm mb-2">
                © {new Date().getFullYear()} {mosqueInfo.fullName}. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs">
                Following the Quran and authentic Sunnah
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Donation Modal */}
      <DonationModal open={donationModalOpen} onClose={() => setDonationModalOpen(false)} />
    </div>
  );
};

export default Home;
