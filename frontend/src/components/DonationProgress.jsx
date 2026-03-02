import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { TrendingUp } from 'lucide-react';

const DonationProgress = ({ goal }) => {
  if (!goal) return null;

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="shadow-lg border-l-4 border-l-cyan-600">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-cyan-600">
          <TrendingUp className="h-5 w-5" />
          {goal.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{goal.description}</p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-900">
                {formatCurrency(goal.current_amount, goal.currency)}
              </span>
              <span className="text-gray-600">
                of {formatCurrency(goal.target_amount, goal.currency)}
              </span>
            </div>
            
            <Progress value={goal.percentage} className="h-3" />
            
            <div className="text-center">
              <span className="text-2xl font-bold text-cyan-600">
                {goal.percentage.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-600 ml-2">funded</span>
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Every donation brings us closer to serving our community better
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DonationProgress;
