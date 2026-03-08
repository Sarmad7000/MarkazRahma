import React from 'react';
import { Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import DonationProgress from '../DonationProgress';

const DonationSection = ({ donationInfo, donationGoal }) => {
  const handleDonateClick = () => {
    window.open('https://checkout.square.site/merchant/MLSD6EY5CMY2P/checkout/HXF33WVBEFWIA65YBXUQST3B?src=sheet', '_blank');
  };

  return (
    <section id="donate" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Heart className="h-12 w-12 text-cyan-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{donationInfo.title}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{donationInfo.message}</p>
          </div>

          {donationGoal && (
            <div className="mb-8">
              <DonationProgress goal={donationGoal} />
            </div>
          )}

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
