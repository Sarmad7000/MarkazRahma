import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Loader2, Play } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import Header from '../components/sections/Header';
import Footer from '../components/sections/Footer';
import { mosqueInfo } from '../data/mock';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const YouTubeRecordings = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredVideos(videos);
    } else {
      const filtered = videos.filter(video =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVideos(filtered);
    }
  }, [searchQuery, videos]);

  const fetchVideos = async () => {
    try {
      const response = await fetch(`${API}/api/youtube/videos`);
      const data = await response.json();
      setVideos(data.videos || []);
      setFilteredVideos(data.videos || []);
      
      // Set first video as selected by default
      if (data.videos && data.videos.length > 0) {
        setSelectedVideo(data.videos[0]);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = () => {
    window.open('https://checkout.square.site/merchant/MLSD6EY5CMY2P/checkout/HXF33WVBEFWIA65YBXUQST3B?src=sheet', '_blank');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cyan-50 to-white">
      <Header mosqueInfo={mosqueInfo} onDonate={handleDonate} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="mb-6 text-cyan-600 hover:text-cyan-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-cyan-700 mb-2">
            YouTube Recordings
          </h1>
          <p className="text-gray-600">
            Watch our latest lectures and recordings
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-lg border-gray-300 focus:border-cyan-500"
            />
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              Found {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              {searchQuery ? 'No videos found matching your search' : 'No videos available'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured Video Player */}
            {selectedVideo && (
              <Card className="border-cyan-200 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-video w-full">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${selectedVideo.id}`}
                      title={selectedVideo.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedVideo.title}
                    </h2>
                    <p className="text-sm text-gray-500 mb-3">
                      Published {formatDate(selectedVideo.published_at)}
                    </p>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedVideo.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Video Grid */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                All Videos ({filteredVideos.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVideos.map((video) => (
                  <Card
                    key={video.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedVideo?.id === video.id
                        ? 'ring-2 ring-cyan-500 border-cyan-500'
                        : 'border-gray-200 hover:border-cyan-300'
                    }`}
                    onClick={() => {
                      setSelectedVideo(video);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <CardContent className="p-0">
                      <div className="relative aspect-video">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center group">
                          <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {selectedVideo?.id === video.id && (
                          <div className="absolute top-2 right-2 bg-cyan-600 text-white px-2 py-1 rounded text-xs font-semibold">
                            Now Playing
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-sm line-clamp-2 mb-2 text-gray-900">
                          {video.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {formatDate(video.published_at)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer mosqueInfo={mosqueInfo} />
    </div>
  );
};

export default YouTubeRecordings;
