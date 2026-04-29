import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Trash2, Plus, Save, Image as ImageIcon, Video, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  getHeroCards,
  createHeroCard,
  updateHeroCard,
  deleteHeroCard,
  updateHeroSettings,
  uploadPopupImage
} from '../../services/adminApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const HeroTab = () => {
  const [cards, setCards] = useState([]);
  const [settings, setSettings] = useState({
    carousel_enabled: false,
    scroll_interval: 5000
  });
  const [loading, setLoading] = useState(true);
  const [newCard, setNewCard] = useState({
    title: '',
    content_type: 'video',
    content_url: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cardsData, settingsData] = await Promise.all([
        getHeroCards(),
        fetch(process.env.REACT_APP_BACKEND_URL + '/api/hero/settings').then(r => r.json())
      ]);
      setCards(cardsData.cards || []);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error fetching hero data:', error);
      toast.error('Failed to load hero carousel data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCarousel = async (enabled) => {
    try {
      await updateHeroSettings({ carousel_enabled: enabled });
      setSettings({ ...settings, carousel_enabled: enabled });
      toast.success(`Carousel ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update carousel setting');
    }
  };

  const handleUpdateInterval = async () => {
    try {
      await updateHeroSettings({ scroll_interval: settings.scroll_interval });
      toast.success('Scroll interval updated');
    } catch (error) {
      toast.error('Failed to update scroll interval');
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadPopupImage(file);
      setNewCard({ ...newCard, content_url: result.image_path });
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateCard = async () => {
    if (!newCard.title || !newCard.content_url) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await createHeroCard({
        ...newCard,
        order: cards.length
      });
      toast.success('Hero card created successfully');
      setNewCard({ title: '', content_type: 'video', content_url: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create hero card');
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;

    try {
      await deleteHeroCard(cardId);
      toast.success('Hero card deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete hero card');
    }
  };

  const handleToggleCardStatus = async (card) => {
    try {
      await updateHeroCard(card.id, { enabled: !card.enabled });
      toast.success(`Card ${!card.enabled ? 'enabled' : 'disabled'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update card status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading hero carousel settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Carousel Settings</CardTitle>
          <CardDescription>
            Enable carousel mode to show multiple hero cards. When disabled, shows the default hero section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Carousel */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Enable Hero Carousel</Label>
              <p className="text-sm text-gray-500">
                Turn on to show carousel with custom cards
              </p>
            </div>
            <Switch
              checked={settings.carousel_enabled}
              onCheckedChange={handleToggleCarousel}
            />
          </div>

          {/* Scroll Interval */}
          {settings.carousel_enabled && (
            <div className="space-y-3">
              <Label htmlFor="scroll-interval">Auto-scroll Interval (milliseconds)</Label>
              <div className="flex gap-2">
                <Input
                  id="scroll-interval"
                  type="number"
                  min="1000"
                  step="1000"
                  value={settings.scroll_interval}
                  onChange={(e) => setSettings({ ...settings, scroll_interval: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <Button onClick={handleUpdateInterval} className="bg-cyan-600 hover:bg-cyan-700">
                  <Save className="h-4 w-4 mr-2" />
                  Update
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Recommended: 5000ms (5 seconds). Current: {settings.scroll_interval / 1000} seconds
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Card */}
      {settings.carousel_enabled && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Hero Card</CardTitle>
            <CardDescription>
              Create a new card with a YouTube video or image. The default hero (logo + text) will always be the first card.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="card-title">Card Title</Label>
              <Input
                id="card-title"
                placeholder="Enter card title..."
                value={newCard.title}
                onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
              />
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <Label htmlFor="content-type">Content Type</Label>
              <Select
                value={newCard.content_type}
                onValueChange={(value) => setNewCard({ ...newCard, content_type: value, content_url: '' })}
              >
                <SelectTrigger id="content-type">
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      YouTube Video
                    </div>
                  </SelectItem>
                  <SelectItem value="image">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Image
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Content URL/Upload */}
            {newCard.content_type === 'video' ? (
              <div className="space-y-2">
                <Label htmlFor="video-url">YouTube Video URL</Label>
                <Input
                  id="video-url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={newCard.content_url}
                  onChange={(e) => setNewCard({ ...newCard, content_url: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  Paste the full YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="image-upload">Upload Image</Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0])}
                  disabled={uploading}
                />
                {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
                {newCard.content_url && !uploading && (
                  <div className="mt-2">
                    <img
                      src={newCard.content_url}
                      alt="Preview"
                      className="h-32 w-auto rounded border"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Create Button */}
            <Button
              onClick={handleCreateCard}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
              disabled={uploading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Hero Card
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing Cards */}
      {settings.carousel_enabled && cards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Hero Cards</CardTitle>
            <CardDescription>
              {cards.length} custom card{cards.length !== 1 ? 's' : ''} (plus default hero card)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cards.map((card, index) => (
                <div
                  key={card.id}
                  className="flex items-center gap-3 p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                >
                  <GripVertical className="h-5 w-5 text-gray-400" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {card.content_type === 'video' ? (
                        <Video className="h-4 w-4 text-cyan-600" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-cyan-600" />
                      )}
                      <span className="font-medium text-gray-900 truncate">{card.title}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{card.content_url}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={card.enabled}
                      onCheckedChange={() => handleToggleCardStatus(card)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCard(card.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Info */}
      {settings.carousel_enabled && (
        <Card className="border-cyan-200 bg-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 bg-cyan-600 rounded-full mt-2"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-cyan-900">
                  Carousel is enabled
                </p>
                <p className="text-sm text-cyan-700">
                  Visitors will see {cards.length + 1} total cards (1 default + {cards.length} custom). 
                  Cards auto-scroll every {settings.scroll_interval / 1000} seconds.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HeroTab;
