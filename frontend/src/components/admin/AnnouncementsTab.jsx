import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const AnnouncementsTab = ({
  announcements,
  announcementsEnabled,
  handleToggleAnnouncementsSystem,
  handleCreateAnnouncement,
  handleUpdateAnnouncement,
  handleDeleteAnnouncement
}) => {
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const startEdit = (announcement) => {
    setEditingId(announcement.id);
    setEditingText(announcement.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const saveEdit = async (id) => {
    if (!editingText.trim()) {
      toast.error('Announcement text cannot be empty');
      return;
    }
    
    try {
      await handleUpdateAnnouncement(id, { text: editingText });
      setEditingId(null);
      setEditingText('');
    } catch (error) {
      // Error already handled in parent
    }
  };

  const handleCreate = async () => {
    if (!newAnnouncementText.trim()) {
      toast.error('Please enter announcement text');
      return;
    }

    try {
      await handleCreateAnnouncement(newAnnouncementText);
      setNewAnnouncementText('');
    } catch (error) {
      // Error already handled in parent
    }
  };

  const toggleEnabled = async (id, currentStatus) => {
    try {
      await handleUpdateAnnouncement(id, { enabled: !currentStatus });
    } catch (error) {
      // Error already handled in parent
    }
  };

  return (
    <div className="space-y-6">
      {/* System Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Announcements System</CardTitle>
          <p className="text-sm text-gray-600">
            Control whether announcements are displayed on the site
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-base font-semibold">Enable Announcements</Label>
              <p className="text-sm text-gray-600">
                Show announcements in the prayer times carousel
              </p>
            </div>
            <Switch
              checked={announcementsEnabled}
              onCheckedChange={handleToggleAnnouncementsSystem}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add New Announcement */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newAnnouncementText}
              onChange={(e) => setNewAnnouncementText(e.target.value)}
              placeholder="Enter announcement text..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreate();
                }
              }}
            />
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Announcements</CardTitle>
          <p className="text-sm text-gray-600">
            {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No announcements yet. Create your first announcement above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border ${
                    announcement.enabled
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-50 border-gray-300 opacity-60'
                  }`}
                >
                  {editingId === announcement.id ? (
                    <>
                      <Input
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => saveEdit(announcement.id)}
                        variant="default"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={cancelEdit}
                        variant="outline"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className={announcement.enabled ? '' : 'line-through'}>
                          {announcement.text}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {new Date(announcement.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={announcement.enabled}
                          onCheckedChange={() =>
                            toggleEnabled(announcement.id, announcement.enabled)
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(announcement)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnouncementsTab;
