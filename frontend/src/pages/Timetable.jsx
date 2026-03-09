import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import Header from '../components/sections/Header';
import Footer from '../components/sections/Footer';
import { mosqueInfo } from '../data/mock';

const API = process.env.REACT_APP_BACKEND_URL;

const Timetable = () => {
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const response = await fetch(`${API}/api/timetable`);
      const data = await response.json();
      setTimetable(data);
    } catch (error) {
      console.error('Error fetching timetable:', error);
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

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Calendar className="h-12 w-12 text-cyan-600 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Prayer Timetable
            </h1>
            <p className="text-lg text-gray-600">
              View our prayer times schedule
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
            </div>
          ) : timetable?.image_path ? (
            <Card className="overflow-hidden shadow-lg">
              <img
                src={timetable.image_path}
                alt="Prayer Timetable"
                className="w-full h-auto"
              />
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Prayer Timetable Available
              </h3>
              <p className="text-gray-500">
                The prayer timetable will be available soon. Please check back later.
              </p>
            </Card>
          )}
        </div>
      </div>

      <Footer mosqueInfo={mosqueInfo} />
    </div>
  );
};

export default Timetable;
