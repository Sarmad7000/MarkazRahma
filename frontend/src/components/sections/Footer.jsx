import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = ({ mosqueInfo }) => {
  const navigate = useNavigate();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <div className="h-20 w-auto mx-auto mb-4 flex justify-center items-center bg-white rounded-lg p-3" style={{ width: 'fit-content' }}>
              <img 
                src="https://customer-assets.emergentagent.com/job_markaz-rahma-1/artifacts/zuluigci_Untitled%20design%20%2849%29.png" 
                alt="Markaz Al-Rahma Logo" 
                className="h-16 w-auto"
              />
            </div>
            <h3 className="text-2xl font-bold mb-2">{mosqueInfo.name}</h3>
          </div>
          
          <div className="border-t border-gray-800 pt-6">
            <p className="text-gray-400 text-sm mb-2">
              © {new Date().getFullYear()} {mosqueInfo.fullName}. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs mb-4">
              Following the Quran and authentic Sunnah
            </p>
            <button
              onClick={() => navigate('/admin/login')}
              className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
