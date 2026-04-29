import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Settings } from 'lucide-react';

const SettingsTab = ({ 
  editingGoal, 
  setEditingGoal, 
  handleUpdateGoal,
  goal 
}) => {
  return (
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
  );
};

export default SettingsTab;
