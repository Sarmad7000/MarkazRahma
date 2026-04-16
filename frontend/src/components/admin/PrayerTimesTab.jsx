import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Clock, Save, Upload, FileSpreadsheet, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { bulkUpdatePrayerTimes } from '../../services/adminApi';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

const PrayerTimesTab = ({ 
  prayerTimes, 
  editingPrayer, 
  setEditingPrayer, 
  handleUpdateIqamah,
  editingJummah,
  setEditingJummah,
  handleUpdateJummah
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleUpdateAllIqamah = async () => {
    // Update all iqamah times at once
    const prayers = prayerTimes?.prayers || [];
    for (const prayer of prayers) {
      if (editingPrayer[prayer.name]) {
        await handleUpdateIqamah(prayer.name);
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
      setShowConfirmDialog(true);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setShowConfirmDialog(false);

    try {
      const result = await bulkUpdatePrayerTimes(selectedFile);
      toast.success(result.message || `Updated ${result.updated_count} dates successfully`);
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('csv-upload');
      if (fileInput) fileInput.value = '';
      
      // Refresh prayer times
      window.location.reload();
    } catch (error) {
      console.error('Bulk upload error:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to upload CSV';
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = `Date,Fajr_Adhan,Fajr_Iqama,Dhuhr_Adhan,Dhuhr_Iqama,Asr_Adhan,Asr_Iqama,Maghrib_Adhan,Maghrib_Iqama,Isha_Adhan,Isha_Iqama,Sunrise,Sunset
2026-05-01,04:19,04:34,13:01,13:16,16:49,17:04,20:00,20:05,21:44,21:59,05:55,20:00
2026-05-02,04:17,04:32,13:01,13:16,16:50,17:05,20:01,20:06,21:45,22:00,05:53,20:01
2026-05-03,04:15,04:30,13:01,13:16,16:51,17:06,20:02,20:07,21:47,22:02,05:51,20:02`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prayer_times_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCancelUpload = () => {
    setShowConfirmDialog(false);
    setSelectedFile(null);
    const fileInput = document.getElementById('csv-upload');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Bulk CSV Upload Card */}
      <Card className="border-cyan-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-cyan-600" />
            Bulk Update Prayer Times via CSV
          </CardTitle>
          <CardDescription>Upload both Adhan and Iqamah times for an entire month</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 space-y-2">
                <p className="font-semibold">CSV Format Requirements:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Required columns:</strong> Date, Fajr_Adhan, Fajr_Iqama, Dhuhr_Adhan, Dhuhr_Iqama, Asr_Adhan, Asr_Iqama, Maghrib_Adhan, Maghrib_Iqama, Isha_Adhan, Isha_Iqama</li>
                  <li><strong>Optional columns:</strong> Sunrise, Sunset</li>
                  <li>Date format: YYYY-MM-DD (e.g., 2026-05-01)</li>
                  <li>Time format: HH:MM in 24-hour format (e.g., 13:30)</li>
                  <li>Jummah time will automatically match Dhuhr Iqamah time</li>
                  <li>Both "Dhuhr" and "Duhur" spellings are accepted</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={downloadSampleCSV}
              variant="outline"
              className="border-cyan-600 text-cyan-600 hover:bg-cyan-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Sample CSV
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-upload" className="text-sm font-medium">
              Select CSV File
            </Label>
            <div className="flex gap-2">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={uploading}
                className="flex-1"
              />
              {uploading && (
                <Button disabled className="bg-cyan-600">
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </Button>
              )}
            </div>
            {selectedFile && !uploading && (
              <p className="text-sm text-gray-500">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Update</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You are about to upload: <span className="font-semibold">{selectedFile?.name}</span></p>
              <p>This will update both Adhan and Iqamah times for all dates in the CSV file. The file will be validated first, and the upload will be rejected if any errors are found.</p>
              <p className="text-amber-600 font-medium">⚠️ This action will overwrite existing prayer times for the dates in the CSV.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelUpload}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkUpload}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              Confirm Upload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
