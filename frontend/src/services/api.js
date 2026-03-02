import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Prayer Times API
export const getPrayerTimes = async () => {
  try {
    const response = await axios.get(`${API}/prayers/today`);
    return response.data;
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    throw error;
  }
};

export const getPrayerTimesByDate = async (date) => {
  try {
    const response = await axios.get(`${API}/prayers/date?date=${date}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching prayer times by date:', error);
    throw error;
  }
};

// Donation API
export const createDonationCheckout = async (amount) => {
  try {
    const originUrl = window.location.origin;
    const successUrl = `${originUrl}/?donation=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${originUrl}/?donation=cancelled`;
    
    const response = await axios.post(`${API}/donations/create-checkout`, {
      amount: parseFloat(amount),
      currency: 'gbp',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        source: 'web_donation',
        timestamp: new Date().toISOString()
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating donation checkout:', error);
    throw error;
  }
};

export const getDonationStatus = async (sessionId) => {
  try {
    const response = await axios.get(`${API}/donations/status/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching donation status:', error);
    throw error;
  }
};

export const getDonationGoal = async () => {
  try {
    const response = await axios.get(`${API}/donations/goal`);
    return response.data;
  } catch (error) {
    console.error('Error fetching donation goal:', error);
    throw error;
  }
};
