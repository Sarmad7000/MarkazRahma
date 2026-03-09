import React from 'react';
import { MapPin } from 'lucide-react';
import { Card } from '../ui/card';

const LocationSection = ({ mosqueInfo }) => {
  return (
    <section id="location" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <MapPin className="h-12 w-12 text-cyan-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Visit Us</h2>
            <p className="text-lg text-gray-600">
              <a 
                href="https://share.google/0PAArCw19mQdSIzvG" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-600 hover:text-cyan-700 hover:underline"
              >
                {mosqueInfo.location.address}
              </a>
            </p>
          </div>

          <Card className="shadow-lg overflow-hidden">
            <div className="h-96 w-full">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2476.8!2d-0.2507!3d51.5906!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487618c3a1e7e9e3%3A0x1234567890!2s15a%20Carlisle%20Rd%2C%20London%20NW9%200HD!5e0!3m2!1sen!2suk!4v1234567890!5m2!1sen!2suk"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Markaz Al-Rahma Location"
              ></iframe>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;
