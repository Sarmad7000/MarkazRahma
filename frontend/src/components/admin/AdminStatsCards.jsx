import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Heart, TrendingUp, Calendar } from 'lucide-react';

const AdminStatsCards = ({ stats }) => {
  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Total Donations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-cyan-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats?.total_donations || 0}</div>
              <div className="text-sm text-gray-500">All time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Total Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                £{stats?.total_amount?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-500">Raised</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Recent (7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats?.recent_donations || 0}</div>
              <div className="text-sm text-gray-500">Donations</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStatsCards;
