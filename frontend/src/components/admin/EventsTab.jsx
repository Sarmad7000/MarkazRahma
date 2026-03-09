import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Plus, Trash2, Edit2, Save, X, Upload } from 'lucide-react';
import { toast } from 'sonner';

const EventsTab = ({
  events,
  handleCreateEvent,
  handleUpdateEvent,
  handleDeleteEvent,
  handleUploadImage
}) => {
  const [newEvent, setNewEvent] = useState({ title: '', description: '', image_path: '' });
  const [editingId, setEditingId] = useState(null);
  const [editingEvent, setEditingEvent] = useState({});
  const [uploadingNew, setUploadingNew] = useState(false);
  const [uploadingEdit, setUploadingEdit] = useState(false);

  const handleFileUpload = async (file, isEdit = false) => {
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
      isEdit ? setUploadingEdit(true) : setUploadingNew(true);
      const result = await handleUploadImage(file);
      
      if (isEdit) {
        setEditingEvent({ ...editingEvent, image_path: result.image_path });
      } else {
        setNewEvent({ ...newEvent, image_path: result.image_path });
      }
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      isEdit ? setUploadingEdit(false) : setUploadingNew(false);
    }
  };

  const startEdit = (event) => {
    setEditingId(event.id);
    setEditingEvent({ ...event });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingEvent({});
  };

  const saveEdit = async (id) => {
    if (!editingEvent.title?.trim() || !editingEvent.description?.trim()) {
      toast.error('Title and description are required');
      return;
    }
    
    try {
      await handleUpdateEvent(id, editingEvent);
      setEditingId(null);
      setEditingEvent({});
    } catch (error) {
      // Error handled in parent
    }
  };

  const handleCreate = async () => {
    if (!newEvent.title?.trim() || !newEvent.description?.trim()) {
      toast.error('Title and description are required');
      return;
    }

    if (!newEvent.image_path) {
      toast.error('Please upload an image');
      return;
    }

    try {
      await handleCreateEvent(newEvent);
      setNewEvent({ title: '', description: '', image_path: '' });
    } catch (error) {
      // Error handled in parent
    }
  };

  const toggleEnabled = async (id, currentStatus) => {
    try {
      await handleUpdateEvent(id, { enabled: !currentStatus });
    } catch (error) {
      // Error handled in parent
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Add New Event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-sm sm:text-base">Title</Label>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Event title..."
                className="mt-1 text-sm sm:text-base"
              />
            </div>
            <div>
              <Label className="text-sm sm:text-base">Description</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Event description..."
                rows={4}
                className="mt-1 text-sm sm:text-base"
              />
            </div>
            <div>
              <Label className="text-sm sm:text-base">Event Image</Label>
              <div className="flex flex-col gap-2 mt-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files[0], false)}
                  disabled={uploadingNew}
                  className="text-xs sm:text-sm"
                />
                {uploadingNew && <p className="text-xs sm:text-sm text-cyan-600">Uploading...</p>}
                {newEvent.image_path && (
                  <img src={newEvent.image_path} alt="Preview" className="max-h-32 sm:max-h-40 object-contain rounded border" />
                )}
              </div>
            </div>
            <Button onClick={handleCreate} className="w-full text-sm sm:text-base">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Manage Events</CardTitle>
          <p className="text-xs sm:text-sm text-gray-600">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <p className="text-sm sm:text-base">No events yet. Create your first event above.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 sm:p-4 rounded-lg border ${
                    event.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300 opacity-60'
                  }`}
                >
                  {editingId === event.id ? (
                    <div className="space-y-3 sm:space-y-4">
                      <Input
                        value={editingEvent.title}
                        onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                        placeholder="Title"
                        className="text-sm sm:text-base"
                      />
                      <Textarea
                        value={editingEvent.description}
                        onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                        placeholder="Description"
                        rows={3}
                        className="text-sm sm:text-base"
                      />
                      <div>
                        <Label className="text-sm sm:text-base">Change Image</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e.target.files[0], true)}
                          disabled={uploadingEdit}
                          className="mt-1 text-xs sm:text-sm"
                        />
                        {uploadingEdit && <p className="text-xs sm:text-sm text-cyan-600">Uploading...</p>}
                      </div>
                      {editingEvent.image_path && (
                        <img src={editingEvent.image_path} alt="Preview" className="max-h-32 sm:max-h-40 object-contain rounded border" />
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(event.id)} className="flex-1 text-xs sm:text-sm">
                          <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Save
                        </Button>
                        <Button size="sm" onClick={cancelEdit} variant="outline" className="flex-1 text-xs sm:text-sm">
                          <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      {event.image_path && (
                        <img src={event.image_path} alt={event.title} className="w-full sm:w-24 md:w-32 h-20 sm:h-24 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold mb-1 text-sm sm:text-base ${event.enabled ? '' : 'line-through'}`}>{event.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{event.description}</p>
                      </div>
                      <div className="flex flex-row sm:flex-col gap-2 items-center justify-end sm:justify-start">
                        <Switch checked={event.enabled} onCheckedChange={() => toggleEnabled(event.id, event.enabled)} />
                        <Button size="sm" variant="outline" onClick={() => startEdit(event)} className="h-8 w-8 p-0">
                          <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(event.id)} className="h-8 w-8 p-0">
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
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

export default EventsTab;