import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast, Toaster } from 'sonner';
import {
  isAuthenticated,
  logout,
  getDonationHistory,
  getDonationStats,
  updateIqamahTime,
  updateJummahTimes,
  updateDonationGoal
} from '../services/adminApi';
import { getPrayerTimes, getDonationGoal } from '../services/api';
import {
  Clock,
  Heart,
  Settings,
  LogOut,
  TrendingUp,
  Users,
  Calendar,
  Loader2
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState(null);
  const [goal, setGoal] = useState(null);
  const [editingPrayer, setEditingPrayer] = useState({});
  const [editingJummah, setEditingJummah] = useState({khutbah: '', salah: ''});
  const [editingGoal, setEditingGoal] = useState({title: '', target_amount: '', description: ''});

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prayerData, donationData, statsData, goalData] = await Promise.all([
        getPrayerTimes(),
        getDonationHistory(),
        getDonationStats(),
        getDonationGoal()
      ]);

      setPrayerTimes(prayerData);
      setDonations(donationData);
      setStats(statsData);
      setGoal(goalData);

      // Initialize editing states
      const initialEditing = {};
      prayerData.prayers.forEach(p => {
        initialEditing[p.name] = p.iqamah;
      });
      setEditingPrayer(initialEditing);
      setEditingJummah({
        khutbah: prayerData.jummah.khutbah,
        salah: prayerData.jummah.salah
      });
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
  };

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
      await updateJummahTimes(editingJummah.khutbah, editingJummah.salah);
      toast.success('Jummah times updated successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to update Jummah times');
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
                <p className="text-sm text-cyan-600">Markaz Al-Rahma Management</p>
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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Heart className="h-8 w-8 text-cyan-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats?.total_donations || 0}</div>
                  <div className="text-sm text-gray-500">All time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    £{stats?.total_amount?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-gray-500">Raised</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Recent (7 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats?.recent_donations || 0}</div>
                  <div className="text-sm text-gray-500">Donations</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="prayers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="prayers">Prayer Times</TabsTrigger>
            <TabsTrigger value="donations">Donations</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Prayer Times Tab */}
          <TabsContent value="prayers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-cyan-600" />
                  Manage Iqamah Times
                </CardTitle>
                <CardDescription>Update prayer congregation times</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {prayerTimes?.prayers.map((prayer) => (
                  <div key={prayer.name} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{prayer.name}</div>
                      <div className="text-sm text-gray-500">Adhan: {prayer.adhan}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Iqamah:</Label>
                      <Input
                        type="time"
                        value={editingPrayer[prayer.name] || ''}
                        onChange={(e) => setEditingPrayer({...editingPrayer, [prayer.name]: e.target.value})}
                        className="w-32"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdateIqamah(prayer.name)}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Jummah Times */}
                <div className="mt-6 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                  <div className="font-semibold text-gray-900 mb-4">Jummah (Friday) Times</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Khutbah Time</Label>
                      <Input
                        type="time"
                        value={editingJummah.khutbah}
                        onChange={(e) => setEditingJummah({...editingJummah, khutbah: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Salah Time</Label>
                      <Input
                        type="time"
                        value={editingJummah.salah}
                        onChange={(e) => setEditingJummah({...editingJummah, salah: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleUpdateJummah}
                    className="mt-4 bg-cyan-600 hover:bg-cyan-700"
                  >
                    Update Jummah Times
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Donations Tab */}
          <TabsContent value="donations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-cyan-600" />
                  Donation History
                </CardTitle>
                <CardDescription>Recent donations received</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Date</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Amount</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Session ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center p-8 text-gray-500">
                            No donations yet
                          </td>
                        </tr>
                      ) : (
                        donations.map((donation) => (
                          <tr key={donation.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-sm">
                              {new Date(donation.created_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="p-3 text-sm font-semibold">
                              £{donation.amount.toFixed(2)}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                donation.payment_status === 'paid' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {donation.payment_status}
                              </span>
                            </td>
                            <td className="p-3 text-xs text-gray-500 font-mono">
                              {donation.session_id.substring(0, 20)}...
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-cyan-600" />
                  Donation Goal Settings
                </CardTitle>
                <CardDescription>Manage fundraising campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Campaign Title</Label>
                  <Input
                    value={editingGoal.title}
                    onChange={(e) => setEditingGoal({...editingGoal, title: e.target.value})}
                    placeholder="e.g., Mosque Expansion Fund"
                  />
                </div>
                <div>
                  <Label>Target Amount (£)</Label>
                  <Input
                    type="number"
                    value={editingGoal.target_amount}
                    onChange={(e) => setEditingGoal({...editingGoal, target_amount: e.target.value})}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={editingGoal.description}
                    onChange={(e) => setEditingGoal({...editingGoal, description: e.target.value})}
                    placeholder="Help us expand our space..."
                  />
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Current Progress</div>
                  <div className="text-2xl font-bold text-cyan-600">
                    £{goal?.current_amount?.toFixed(2) || '0.00'} / £{goal?.target_amount?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-gray-500">{goal?.percentage?.toFixed(1) || 0}% funded</div>
                </div>
                <Button
                  onClick={handleUpdateGoal}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  Update Goal Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
