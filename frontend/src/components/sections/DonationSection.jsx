import React from 'react';
import { Heart, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import DonationProgress from '../DonationProgress';

const DonationSection = ({ donationInfo, donationGoal }) => {
  const handleDonateClick = () => {
    window.open('https://checkout.square.site/merchant/MLSD6EY5CMY2P/checkout/HXF33WVBEFWIA65YBXUQST3B?src=sheet', '_blank');
  };

  return (
    <section id="donate" className="py-16 bg-gradient-to-br from-gray-50 to-cyan-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Heart className="h-12 w-12 text-cyan-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{donationInfo.title}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{donationInfo.message}</p>
          </div>

          {/* Video and Donation Progress Section */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* YouTube Video Embed */}
            <Card className="shadow-xl overflow-hidden">
              <div className="relative aspect-video bg-gray-900">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/ADYto8Y1MFk"
                  title="Mosque Appeal Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <CardHeader className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Our Story
                </CardTitle>
                <CardDescription className="text-cyan-50">
                  Watch our appeal for the new mosque
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Donation Progress */}
            {donationGoal && (
              <div className="flex flex-col justify-center">
                <DonationProgress goal={donationGoal} />
                <div className="mt-6 p-6 bg-white rounded-lg shadow-lg border-2 border-cyan-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-2">Every Contribution Matters</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Help us secure a permanent home for our growing community. Your donation will help establish a lasting place of worship and learning.
                  </p>
                  <div className="mt-4 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <p className="text-xs text-cyan-900 font-medium">
                      "Whoever builds a mosque for Allah, Allah will build for him a house like it in Paradise."
                      <span className="block text-cyan-700 mt-1">- Sahih Al-Bukhari 450</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Donation Methods */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-br from-cyan-600 to-cyan-700 text-white">
                <CardTitle>Online Donation</CardTitle>
                <CardDescription className="text-cyan-50">Quick and secure payment</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Button 
                    onClick={handleDonateClick}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-6 text-lg"
                  >
                    <Heart className="mr-2 h-5 w-5" />
                    Donate Now
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-4">
                    All donations are used for mosque expansion and community services. May Allah reward you.
                  </p>
                </div>
              </CardContent>
            </Card>

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
  );
};

export default DonationSection;
