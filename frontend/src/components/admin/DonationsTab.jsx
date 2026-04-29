import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Heart, TrendingUp } from 'lucide-react';

const DonationsTab = ({ donations, donationSummary }) => {
  return (
    <div className="space-y-6">
      {/* Donation Summary */}
      {donationSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-600" />
              Donation Breakdown by Source
            </CardTitle>
            <CardDescription>How donations are coming in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900">Online (Square/Website)</div>
                    <div className="text-sm text-gray-600">{donationSummary.stripe.count} donations</div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    £{donationSummary.stripe.total.toFixed(2)}
                  </div>
                </div>
              </div>

              {['bank_transfer', 'cash'].map((source) => {
                const data = donationSummary.offline[source];
                if (!data || data.count === 0) return null;
                
                return (
                  <div key={source} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-gray-900 capitalize">
                          {source.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-600">{data.count} donations</div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        £{data.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-cyan-600" />
            Donation History
          </CardTitle>
          <CardDescription>All donations received</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Source</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {donations.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-8 text-gray-500">
                      No donations yet
                    </td>
                  </tr>
                ) : (
                  donations.map((donation) => (
                    <tr key={donation.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-sm">
                        {new Date(donation.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-3 text-sm font-semibold">
                        £{donation.amount.toFixed(2)}
                      </td>
                      <td className="p-3 text-sm">
                        <span className="capitalize">
                          {donation.metadata?.source === 'web_donation' ? 'Website' : 
                           donation.metadata?.source?.replace('_', ' ') || 'Website'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          donation.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {donation.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DonationsTab;
