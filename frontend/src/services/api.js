import useSWR from 'swr';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// SWR fetcher function
const fetcher = (url) => axios.get(url).then(res => res.data);

// Custom hook for prayer times with SWR
export const usePrayerTimes = () => {
  const { data, error, isLoading, mutate } = useSWR(
    `${API}/prayers/today`,
    fetcher,
    {
      refreshInterval: 3600000, // Refresh every hour (3600000ms)
      revalidateOnFocus: false, // Don't revalidate when window gets focus
      revalidateOnReconnect: true, // Revalidate when internet reconnects
      dedupingInterval: 60000, // Dedupe requests within 60 seconds
      fallbackData: null, // Start with null, will show loading state
      onError: (err) => {
        console.error('Error fetching prayer times:', err);
      }
    }
  );

  return {
    prayerTimes: data,
    isLoading,
    isError: error,
    mutate // Function to manually trigger revalidation
  };
};

// Custom hook for donation goal with SWR
export const useDonationGoal = () => {
  const { data, error, isLoading, mutate } = useSWR(
    `${API}/donations/goal`,
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
      onError: (err) => {
        console.error('Error fetching donation goal:', err);
      }
    }
  );

  return {
    donationGoal: data,
    isLoading,
    isError: error,
    mutate
  };
};

// Original API functions (still available for manual calls)
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
