import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import Header from '../components/sections/Header';
import Footer from '../components/sections/Footer';
import { mosqueInfo } from '../data/mock';

const API = process.env.REACT_APP_BACKEND_URL;

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API}/api/events`);
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = () => {
    window.open('https://checkout.square.site/merchant/MLSD6EY5CMY2P/checkout/HXF33WVBEFWIA65YBXUQST3B?src=sheet', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header mosqueInfo={mosqueInfo} onDonate={handleDonate} />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Calendar className="h-12 w-12 text-cyan-600 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Events & Activities
            </h1>
            <p className="text-lg text-gray-600">
              Stay updated with our latest programs and community events
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
            </div>
          ) : events.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  {event.image_path && (
                    <div className="w-full bg-gray-100 flex items-center justify-center p-4">
                      <img
                        src={event.image_path}
                        alt={event.title}
                        className="w-full h-auto object-contain max-h-96"
                      />
                    </div>
                  )}
                  <CardHeader className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white">
                    <CardTitle>{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {event.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Events Available
              </h3>
              <p className="text-gray-500">
                There are currently no upcoming events. Please check back later.
              </p>
            </Card>
          )}
        </div>
      </div>

      <Footer mosqueInfo={mosqueInfo} />
    </div>
  );
};

export default Events;
