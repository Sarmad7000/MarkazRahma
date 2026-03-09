import React from 'react';
import { Mail, Twitter, Youtube } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

const ContactSection = ({ mosqueInfo }) => {
  return (
    <section id="contact" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-600">Get in touch with our community</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <a
              href={`mailto:${mosqueInfo.contact.email}`}
              className="block"
            >
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50">
                <CardContent className="p-6">
                  <Mail className="h-10 w-10 text-cyan-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                  <p className="text-cyan-600 hover:text-cyan-700">{mosqueInfo.contact.email}</p>
                </CardContent>
              </Card>
            </a>

            <a
              href={mosqueInfo.social.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50">
                <CardContent className="p-6">
                  <Twitter className="h-10 w-10 text-cyan-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Twitter</h3>
                  <p className="text-cyan-600 hover:text-cyan-700">
                    {mosqueInfo.social.twitter}
                  </p>
                </CardContent>
              </Card>
            </a>

            <a
              href="https://www.youtube.com/@markazal-rahma6441"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50">
                <CardContent className="p-6">
                  <Youtube className="h-10 w-10 text-cyan-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">YouTube</h3>
                  <p className="text-cyan-600 hover:text-cyan-700">
                    @markazal-rahma6441
                  </p>
                </CardContent>
              </Card>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
