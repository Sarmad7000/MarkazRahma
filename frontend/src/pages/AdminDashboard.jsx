import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast, Toaster } from 'sonner';
import {
  isAuthenticated,
  logout,
  getDonationHistory,
  getDonationStats,
  updateIqamahTime,
  updateJummahTimes,
  updateDonationGoal,
  addOfflineDonation,
  getDonationSummary
} from '../services/adminApi';
import { getPrayerTimes, getDonationGoal } from '../services/api';
import { LogOut, Loader2 } from 'lucide-react';
import AdminStatsCards from '../components/admin/AdminStatsCards';
import PrayerTimesTab from '../components/admin/PrayerTimesTab';
import DonationsTab from '../components/admin/DonationsTab';
import AddDonationTab from '../components/admin/AddDonationTab';
import SettingsTab from '../components/admin/SettingsTab';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState(null);
  const [goal, setGoal] = useState(null);
  const [editingPrayer, setEditingPrayer] = useState({});
  const [editingJummah, setEditingJummah] = useState('');
  const [editingGoal, setEditingGoal] = useState({title: '', target_amount: '', description: ''});
  const [offlineDonation, setOfflineDonation] = useState({amount: '', source: 'bank_transfer', note: ''});
  const [donationSummary, setDonationSummary] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [prayerData, donationData, statsData, goalData, summaryData] = await Promise.all([
        getPrayerTimes(),
        getDonationHistory(),
        getDonationStats(),
        getDonationGoal(),
        getDonationSummary()
      ]);

      setPrayerTimes(prayerData);
      setDonations(donationData);
      setStats(statsData);
      setGoal(goalData);
      setDonationSummary(summaryData);

      // Initialize editing states
      const initialEditing = {};
      prayerData.prayers.forEach(p => {
        initialEditing[p.name] = p.iqamah;
      });
      setEditingPrayer(initialEditing);
      setEditingJummah(prayerData.jummah.time);
      setEditingGoal({
        title: goalData.title,
        target_amount: goalData.target_amount,
        description: goalData.description
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
      if (error.response?.status === 401) {
        logout();
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate, fetchData]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const handleUpdateIqamah = async (prayerName) => {
    try {
      const newTime = editingPrayer[prayerName];
      await updateIqamahTime(prayerName, newTime);
      toast.success(`${prayerName} Iqamah time updated to ${newTime}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update Iqamah time');
    }
  };

  const handleUpdateJummah = async () => {
    try {
      await updateJummahTimes(editingJummah);
      toast.success('Jummah time updated successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to update Jummah time');
    }
  };

  const handleUpdateGoal = async () => {
    try {
      await updateDonationGoal({
        title: editingGoal.title,
        target_amount: parseFloat(editingGoal.target_amount),
        description: editingGoal.description
      });
      toast.success('Donation goal updated successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to update donation goal');
    }
  };

  const handleAddOfflineDonation = async () => {
    try {
      if (!offlineDonation.amount || parseFloat(offlineDonation.amount) <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      await addOfflineDonation(
        offlineDonation.amount,
        offlineDonation.source,
        offlineDonation.note
      );
      
      toast.success(`£${offlineDonation.amount} donation from ${offlineDonation.source} added successfully`);
      setOfflineDonation({amount: '', source: 'bank_transfer', note: ''});
      fetchData();
    } catch (error) {
      toast.error('Failed to add offline donation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://customer-assets.emergentagent.com/job_markaz-rahma-1/artifacts/s5521pmg_Untitled%20design.png" 
                alt="Logo" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/')}>
                View Website
              </Button>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-8">
        <AdminStatsCards stats={stats} />

        {/* Tabs */}
        <Tabs defaultValue="prayers" className="space-y-6">
          <div className="flex justify-center w-full">
            <TabsList className="inline-flex">
              <TabsTrigger value="prayers" className="px-8">Prayer Times</TabsTrigger>
              <TabsTrigger value="donations" className="px-8">Donations</TabsTrigger>
              <TabsTrigger value="offline" className="px-8">Add Donation</TabsTrigger>
              <TabsTrigger value="settings" className="px-8">Settings</TabsTrigger>
            </TabsList>
          </div>

          {/* Prayer Times Tab */}
          <TabsContent value="prayers" className="space-y-6">
            <PrayerTimesTab 
              prayerTimes={prayerTimes}
              editingPrayer={editingPrayer}
              setEditingPrayer={setEditingPrayer}
              handleUpdateIqamah={handleUpdateIqamah}
              editingJummah={editingJummah}
              setEditingJummah={setEditingJummah}
              handleUpdateJummah={handleUpdateJummah}
            />
          </TabsContent>

          {/* Donations Tab */}
          <TabsContent value="donations">
            <DonationsTab 
              donations={donations}
              donationSummary={donationSummary}
            />
          </TabsContent>

          {/* Add Offline Donation Tab */}
          <TabsContent value="offline">
            <AddDonationTab 
              offlineDonation={offlineDonation}
              setOfflineDonation={setOfflineDonation}
              handleAddOfflineDonation={handleAddOfflineDonation}
              goal={goal}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SettingsTab 
              editingGoal={editingGoal}
              setEditingGoal={setEditingGoal}
              handleUpdateGoal={handleUpdateGoal}
              goal={goal}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
