import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Clock } from 'lucide-react';

const PrayerTimesTab = ({ 
  prayerTimes, 
  editingPrayer, 
  setEditingPrayer, 
  handleUpdateIqamah,
  editingJummah,
  setEditingJummah,
  handleUpdateJummah
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-cyan-600" />
          Manage Iqamah Times
        </CardTitle>
        <CardDescription>Update prayer congregation times</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {prayerTimes?.prayers.map((prayer) => (
          <div key={prayer.name} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{prayer.name}</div>
              <div className="text-sm text-gray-500">Adhan: {prayer.adhan}</div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Iqamah:</Label>
              <Input
                type="time"
                value={editingPrayer[prayer.name] || ''}
                onChange={(e) => setEditingPrayer({...editingPrayer, [prayer.name]: e.target.value})}
                className="w-32"
              />
              <Button
                size="sm"
                onClick={() => handleUpdateIqamah(prayer.name)}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Update
              </Button>
            </div>
          </div>
        ))}

        {/* Jummah Time */}
        <div className="mt-6 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
          <div className="font-semibold text-gray-900 mb-4">Jummah (Friday) Time</div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Jummah Time</Label>
              <Input
                type="time"
                value={editingJummah}
                onChange={(e) => setEditingJummah(e.target.value)}
              />
            </div>
            <Button
              onClick={handleUpdateJummah}
              className="mt-6 bg-cyan-600 hover:bg-cyan-700"
            >
              Update Jummah
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrayerTimesTab;
