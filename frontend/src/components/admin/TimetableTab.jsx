import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Upload, Save, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

const TimetableTab = ({ 
  timetableImage,
  setTimetableImage,
  handleUpdateTimetable,
  handleUploadImage 
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      setUploading(true);
      const result = await handleUploadImage(file);
      setTimetableImage(result.image_path);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Timetable Management</CardTitle>
          <p className="text-sm text-gray-600">
            Upload the weekly timetable image for display on the Timetable page
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Upload Timetable Image</Label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="flex-1"
              />
            </div>
            {uploading && (
              <p className="text-sm text-cyan-600">Uploading...</p>
            )}
          </div>

          {timetableImage && (
            <div className="space-y-2">
              <Label>Current Timetable Preview</Label>
              <div className="border rounded-lg p-4 bg-gray-50">
                <img
                  src={timetableImage}
                  alt="Timetable preview"
                  className="w-full h-auto max-h-96 object-contain rounded"
                />
              </div>
            </div>
          )}

          <Button 
            onClick={handleUpdateTimetable} 
            className="w-full bg-cyan-600 hover:bg-cyan-700"
            disabled={!timetableImage}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Timetable
          </Button>

          {!timetableImage && (
            <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No timetable image uploaded</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimetableTab;