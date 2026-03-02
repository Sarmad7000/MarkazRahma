import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { createDonationCheckout } from '../services/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const DonationModal = ({ open, onClose }) => {
  const [amount, setAmount] = useState('10');
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  const presetAmounts = [10, 25, 50, 100, 250];

  const handleDonate = async () => {
    try {
      const donationAmount = isCustom ? parseFloat(customAmount) : parseFloat(amount);
      
      if (!donationAmount || donationAmount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      setLoading(true);
      const response = await createDonationCheckout(donationAmount);
      
      // Redirect to Stripe checkout
      window.location.href = response.url;
    } catch (error) {
      console.error('Donation error:', error);
      toast.error('Failed to process donation. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Support Markaz Al-Rahma</DialogTitle>
          <DialogDescription>
            Your donation helps us expand our facilities and serve the community better
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Amount (£)</Label>
            <div className="grid grid-cols-5 gap-2">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset.toString() && !isCustom ? "default" : "outline"}
                  className={amount === preset.toString() && !isCustom ? "bg-cyan-600 hover:bg-cyan-700" : ""}
                  onClick={() => {
                    setAmount(preset.toString());
                    setIsCustom(false);
                  }}
                  disabled={loading}
                >
                  £{preset}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-amount">Or Enter Custom Amount (£)</Label>
            <Input
              id="custom-amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setIsCustom(true);
              }}
              disabled={loading}
            />
          </div>

          <div className="pt-4 space-y-2">
            <Button
              onClick={handleDonate}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Donate £{isCustom ? customAmount || '0' : amount}</>
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DonationModal;
