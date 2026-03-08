import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Heart } from 'lucide-react';

const AddDonationTab = ({ 
  offlineDonation, 
  setOfflineDonation, 
  handleAddOfflineDonation,
  goal 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-cyan-600" />
          Add Offline Donation
        </CardTitle>
        <CardDescription>
          Manually add donations from PayPal, LaunchGood, bank transfers, or cash
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            💡 Use this form to record donations received via bank transfer or cash. 
            These will be added to your total fundraising progress.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Donation Amount (£)</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={offlineDonation.amount}
              onChange={(e) => setOfflineDonation({...offlineDonation, amount: e.target.value})}
              placeholder="25.00"
            />
          </div>

          <div>
            <Label>Source</Label>
            <select
              value={offlineDonation.source}
              onChange={(e) => setOfflineDonation({...offlineDonation, source: e.target.value})}
              className="w-full p-2 border rounded-md"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
            </select>
          </div>
        </div>

        <div>
          <Label>Note (Optional)</Label>
          <Input
            value={offlineDonation.note}
            onChange={(e) => setOfflineDonation({...offlineDonation, note: e.target.value})}
            placeholder="e.g., Donor name, reference number, etc."
          />
        </div>

        <Button
          onClick={handleAddOfflineDonation}
          className="w-full bg-cyan-600 hover:bg-cyan-700"
          disabled={!offlineDonation.amount}
        >
          Add £{offlineDonation.amount || '0'} Donation
        </Button>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Current Total Progress</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current:</span>
              <span className="font-semibold">£{goal?.current_amount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Target:</span>
              <span className="font-semibold">£{goal?.target_amount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress:</span>
              <span className="font-semibold text-cyan-600">{goal?.percentage?.toFixed(1) || 0}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AddDonationTab;
