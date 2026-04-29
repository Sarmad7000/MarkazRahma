import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Settings, Monitor, ExternalLink } from 'lucide-react';

const SettingsTab = ({ 
  editingGoal, 
  setEditingGoal, 
  handleUpdateGoal,
  goal 
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-cyan-600" />
            Interior Display
          </CardTitle>
          <CardDescription>
            A full-screen view designed for a TV/monitor inside the masjid. Left half shows
            today's prayer times (with Shuruq), right half shows the hero carousel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => window.open('/admin/interior-display', '_blank')}
            className="bg-cyan-600 hover:bg-cyan-700"
            data-testid="open-interior-display-button"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Interior Display
          </Button>
          <p className="text-xs text-gray-500 mt-3">
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
