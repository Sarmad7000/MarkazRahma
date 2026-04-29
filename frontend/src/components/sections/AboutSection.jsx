import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const AboutSection = ({ aboutContent }) => {
  return (
    <section id="about" className="py-8 md:py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">About Us</h2>
            <p className="text-lg text-gray-600 mb-6">{aboutContent.mission}</p>
            <p className="text-gray-600">{aboutContent.vision}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {aboutContent.values.map((value, index) => (
              <Card key={index} className="border-l-4 border-l-cyan-600 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-cyan-600 text-center">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
