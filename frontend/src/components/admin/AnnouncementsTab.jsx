import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
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
  const [newAnnouncementUrl, setNewAnnouncementUrl] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingUrl, setEditingUrl] = useState('');

  const startEdit = (announcement) => {
    setEditingId(announcement.id);
    setEditingText(announcement.text);
    setEditingUrl(announcement.url || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
    setEditingUrl('');
  };

  const saveEdit = async (id) => {
    if (!editingText.trim()) {
      toast.error('Announcement text cannot be empty');
      return;
    }
    
    try {
      await handleUpdateAnnouncement(id, { text: editingText, url: editingUrl });
      setEditingId(null);
      setEditingText('');
      setEditingUrl('');
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Failed to update announcement. Please try again.');
    }
  };

  const handleCreate = async () => {
    if (!newAnnouncementText.trim()) {
      toast.error('Please enter announcement text');
      return;
    }

    try {
      await handleCreateAnnouncement({ text: newAnnouncementText, url: newAnnouncementUrl });
      setNewAnnouncementText('');
      setNewAnnouncementUrl('');
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement. Please try again.');
    }
  };

  const toggleEnabled = async (id, currentStatus) => {
    try {
      await handleUpdateAnnouncement(id, { enabled: !currentStatus });
    } catch (error) {
      console.error('Error toggling announcement:', error);
      toast.error('Failed to toggle announcement. Please try again.');
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
          <div className="space-y-3">
            <div>
              <Label>Announcement Text</Label>
              <Textarea
                value={newAnnouncementText}
                onChange={(e) => setNewAnnouncementText(e.target.value)}
                placeholder="Enter announcement text... (Shift+Enter for new line)"
                className="mt-1 min-h-[80px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
            </div>
            <div>
              <Label>Link URL (Optional)</Label>
              <Input
                value={newAnnouncementUrl}
                onChange={(e) => setNewAnnouncementUrl(e.target.value)}
                placeholder="https://example.com (leave blank if not needed)"
                className="mt-1"
                type="url"
              />
              <p className="text-xs text-gray-500 mt-1">Users will be redirected here when they click this announcement</p>
            </div>
            <Button onClick={handleCreate} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Announcement
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
                    <div className="flex-1 space-y-2">
                      <Textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        placeholder="Announcement text... (Shift+Enter for new line)"
                        className="min-h-[80px]"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            saveEdit(announcement.id);
                          }
                        }}
                      />
                      <Input
                        value={editingUrl}
                        onChange={(e) => setEditingUrl(e.target.value)}
                        placeholder="Link URL (optional)"
                        type="url"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveEdit(announcement.id)}
                          variant="default"
                        >
                          <Save className="h-4 w-4 mr-1" /> Save
                        </Button>
                        <Button
                          size="sm"
                          onClick={cancelEdit}
                          variant="outline"
                        >
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className={`whitespace-pre-wrap ${announcement.enabled ? '' : 'line-through'}`}>
                          {announcement.text}
                        </p>
                        {announcement.url && (
                          <p className="text-xs text-cyan-600 mt-1 break-all">
                            🔗 {announcement.url}
                          </p>
                        )}
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
