import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Settings, Monitor, ExternalLink, RotateCw } from 'lucide-react';

const SettingsTab = ({ 
  editingGoal, 
  setEditingGoal, 
  handleUpdateGoal,
  goal 
}) => {
  const [portraitMode, setPortraitMode] = useState(false);
  const [showHero, setShowHero] = useState(true);
  const [heroInterval, setHeroInterval] = useState('');

  const openInteriorDisplay = () => {
    const params = new URLSearchParams();
    if (portraitMode) params.set('orientation', 'portrait');
    if (!showHero) params.set('hero', 'off');
    const intervalNum = parseInt(heroInterval, 10);
    if (intervalNum > 0) params.set('interval', String(intervalNum));
    const qs = params.toString();
    window.open(`/admin/interior-display${qs ? `?${qs}` : ''}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-cyan-600" />
            Interior Display
          </CardTitle>
          <CardDescription>
            A full-screen view designed for a TV/monitor inside the masjid. Configure the
            orientation and whether to show the hero carousel before opening it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <RotateCw className="h-4 w-4 text-cyan-600" />
              <div>
                <Label htmlFor="portrait-toggle" className="font-medium">Portrait orientation</Label>
                <p className="text-xs text-gray-500 mt-0.5">For vertical TVs — stacks content top/bottom instead of left/right.</p>
              </div>
            </div>
            <Switch
              id="portrait-toggle"
              checked={portraitMode}
              onCheckedChange={setPortraitMode}
              data-testid="interior-portrait-toggle"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Monitor className="h-4 w-4 text-cyan-600" />
              <div>
                <Label htmlFor="hero-toggle" className="font-medium">Show hero carousel</Label>
                <p className="text-xs text-gray-500 mt-0.5">When off, prayer times fill the entire screen.</p>
              </div>
            </div>
            <Switch
              id="hero-toggle"
              checked={showHero}
              onCheckedChange={setShowHero}
              data-testid="interior-hero-toggle"
            />
          </div>

          {showHero && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center gap-3">
                <Monitor className="h-4 w-4 text-cyan-600" />
                <div>
                  <Label htmlFor="interior-interval" className="font-medium">Hero auto-scroll interval (seconds)</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Override the carousel speed for this display only. Leave blank to use the site default.</p>
                </div>
              </div>
              <Input
                id="interior-interval"
                type="number"
                min="2"
                placeholder="e.g. 8"
                value={heroInterval}
                onChange={(e) => setHeroInterval(e.target.value)}
                data-testid="interior-interval-input"
              />
            </div>
          )}

          <Button
            onClick={openInteriorDisplay}
            className="bg-cyan-600 hover:bg-cyan-700"
            data-testid="open-interior-display-button"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Interior Display
          </Button>
          <p className="text-xs text-gray-500">
            Tip: open this page on the display device, then press F11 for true full-screen.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-cyan-600" />
            Donation Goal Settings
          </CardTitle>
          <CardDescription>Manage fundraising campaign</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Campaign Title</Label>
            <Input
              value={editingGoal.title}
              onChange={(e) => setEditingGoal({...editingGoal, title: e.target.value})}
              placeholder="e.g., Mosque Expansion Fund"
            />
          </div>
          <div>
            <Label>Target Amount (£)</Label>
            <Input
              type="number"
              value={editingGoal.target_amount}
              onChange={(e) => setEditingGoal({...editingGoal, target_amount: e.target.value})}
              placeholder="50000"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={editingGoal.description}
              onChange={(e) => setEditingGoal({...editingGoal, description: e.target.value})}
              placeholder="Help us expand our space..."
            />
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Current Progress</div>
            <div className="text-2xl font-bold text-cyan-600">
              £{goal?.current_amount?.toFixed(2) || '0.00'} / £{goal?.target_amount?.toFixed(2) || '0.00'}
            </div>
            <div className="text-sm text-gray-500">{goal?.percentage?.toFixed(1) || 0}% funded</div>
          </div>
          <Button
            onClick={handleUpdateGoal}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            Update Goal Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
