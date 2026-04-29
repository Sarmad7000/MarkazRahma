import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Upload, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';

const PopupSettingsTab = ({ 
  popupSettings, 
  setPopupSettings, 
  handleUpdatePopupSettings,
  handleUploadImage 
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      setUploading(true);
      const result = await handleUploadImage(file);
      setPopupSettings({
        ...popupSettings,
        image_path: result.image_path
      });
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
          <CardTitle>Popup Settings</CardTitle>
          <p className="text-sm text-gray-600">
            Manage the popup that appears when users visit the site
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-base font-semibold">Enable Popup</Label>
              <p className="text-sm text-gray-600">Show popup to visitors</p>
            </div>
            <Switch
              checked={popupSettings.enabled}
              onCheckedChange={(checked) =>
                setPopupSettings({ ...popupSettings, enabled: checked })
              }
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Popup Image</Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                disabled={!popupSettings.image_path}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
            {uploading && (
              <p className="text-sm text-cyan-600">Uploading...</p>
            )}
            {popupSettings.image_path && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <img
                  src={popupSettings.image_path}
                  alt="Popup preview"
                  className="max-w-xs rounded border"
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={popupSettings.title}
              onChange={(e) =>
                setPopupSettings({ ...popupSettings, title: e.target.value })
              }
              placeholder="Enter popup title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={popupSettings.description}
              onChange={(e) =>
                setPopupSettings({ ...popupSettings, description: e.target.value })
              }
              placeholder="Enter popup description"
              rows={4}
            />
          </div>

          {/* Citation */}
          <div className="space-y-2">
            <Label>Citation / Footer Text</Label>
            <Textarea
              value={popupSettings.citation}
              onChange={(e) =>
                setPopupSettings({ ...popupSettings, citation: e.target.value })
              }
              placeholder="Enter citation or footer text"
              rows={3}
            />
          </div>

          {/* Save Button */}
          <Button onClick={handleUpdatePopupSettings} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Popup Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PopupSettingsTab;
