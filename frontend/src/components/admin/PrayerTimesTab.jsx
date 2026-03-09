import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Clock, Save } from 'lucide-react';

const PrayerTimesTab = ({ 
  prayerTimes, 
  editingPrayer, 
  setEditingPrayer, 
  handleUpdateIqamah,
  editingJummah,
  setEditingJummah,
  handleUpdateJummah
}) => {
  const handleUpdateAllIqamah = async () => {
    // Update all iqamah times at once
    const prayers = prayerTimes?.prayers || [];
    for (const prayer of prayers) {
      if (editingPrayer[prayer.name]) {
        await handleUpdateIqamah(prayer.name);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-600" />
            Manage Iqamah Times
          </CardTitle>
          <CardDescription>Update prayer congregation times for all prayers at once</CardDescription>
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
              </div>
            </div>
          ))}

          {/* Update All Button */}
          <div className="pt-4">
            <Button
              onClick={handleUpdateAllIqamah}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              Update All Iqamah Times
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jummah Time - Separate Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-600" />
            Jummah (Friday) Prayer
          </CardTitle>
          <CardDescription>Update Friday congregation time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Jummah Time</Label>
              <Input
                type="time"
                value={editingJummah}
                onChange={(e) => setEditingJummah(e.target.value)}
                className="mt-2"
              />
            </div>
            <Button
              onClick={handleUpdateJummah}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Update Jummah Time
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrayerTimesTab;
