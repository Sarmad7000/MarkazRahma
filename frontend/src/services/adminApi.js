import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Token management
const TOKEN_KEY = 'admin_token';

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// Admin API calls
export const adminLogin = async (username, password) => {
  try {
    const response = await axios.post(`${API}/admin/login`, {
      username,
      password
    });
    
    if (response.data.access_token) {
      setAuthToken(response.data.access_token);
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const getDonationHistory = async (limit = 50, skip = 0) => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API}/admin/donations/history?limit=${limit}&skip=${skip}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching donation history:', error);
    throw error;
  }
};

export const getDonationStats = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API}/admin/donations/stats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching donation stats:', error);
    throw error;
  }
};

export const updateIqamahTime = async (prayerName, iqamahTime) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(
      `${API}/prayers/iqamah`,
      {
        prayer_name: prayerName,
        iqamah_time: iqamahTime
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating iqamah time:', error);
    throw error;
  }
};

export const updateJummahTimes = async (time) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(
      `${API}/prayers/jummah`,
      {
        time
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating Jummah time:', error);
    throw error;
  }
};

export const addOfflineDonation = async (amount, source, note) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(
      `${API}/admin/donations/add-offline`,
      {
        amount: parseFloat(amount),
        source,
        note,
        date: new Date().toISOString()
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding offline donation:', error);
    throw error;
  }
};

export const getDonationSummary = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API}/admin/donations/summary`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching donation summary:', error);
    throw error;
  }
};

export const updateDonationGoal = async (goalData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(
      `${API}/admin/donations/goal`,
      goalData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating donation goal:', error);
    throw error;
  }
};

// Popup Settings API
export const updatePopupSettings = async (settings) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(
      `${API}/admin/popup-settings`,
      settings,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating popup settings:', error);
    throw error;
  }
};

export const uploadPopupImage = async (file) => {
  try {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(
      `${API}/admin/upload-image`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Announcements API
export const getAnnouncementsAdmin = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API}/admin/announcements`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching announcements:', error);
    throw error;
  }
};

export const createAnnouncement = async (text, order = 0) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(
      `${API}/admin/announcements`,
      { text, order },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
};

export const updateAnnouncement = async (id, data) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(
      `${API}/admin/announcements/${id}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }
};

export const deleteAnnouncement = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API}/admin/announcements/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
};

export const toggleAnnouncementsSystem = async (enabled) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(
      `${API}/admin/announcements-toggle`,
      null,
      {
        params: { enabled },
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error toggling announcements:', error);
    throw error;
  }
};
