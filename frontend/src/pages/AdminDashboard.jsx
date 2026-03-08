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
  updateDonationGoal,
  addOfflineDonation,
  getDonationSummary
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
  const [editingJummah, setEditingJummah] = useState('');
  const [editingGoal, setEditingGoal] = useState({title: '', target_amount: '', description: ''});
  const [offlineDonation, setOfflineDonation] = useState({amount: '', source: 'paypal', note: ''});
  const [donationSummary, setDonationSummary] = useState(null);

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
      setOfflineDonation({amount: '', source: 'paypal', note: ''});
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

                {/* Jummah Time */}
                <div className="mt-6 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                  <div className="font-semibold text-gray-900 mb-4">Jummah (Friday) Time</div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label>Jummah Time</Label>
                      <Input
                        type="time"
                        value={editingJummah}
                        onChange={(e) => setEditingJummah(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleUpdateJummah}
                      className="mt-6 bg-cyan-600 hover:bg-cyan-700"
                    >
                      Update Jummah
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Donations Tab */}
          <TabsContent value="donations">
            <div className="space-y-6">
              {/* Donation Summary */}
              {donationSummary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-cyan-600" />
                      Donation Breakdown by Source
                    </CardTitle>
                    <CardDescription>How donations are coming in</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-900">Website (Stripe)</div>
                            <div className="text-sm text-gray-600">{donationSummary.stripe.count} donations</div>
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            £{donationSummary.stripe.total.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {Object.entries(donationSummary.offline).map(([source, data]) => (
                        data.count > 0 && (
                          <div key={source} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-semibold text-gray-900 capitalize">{source.replace('_', ' ')}</div>
                                <div className="text-sm text-gray-600">{data.count} donations</div>
                              </div>
                              <div className="text-2xl font-bold text-blue-600">
                                £{data.total.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-cyan-600" />
                    Donation History
                  </CardTitle>
                  <CardDescription>All donations received</CardDescription>
                </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Date</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Amount</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Source</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Status</th>
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
                            <td className="p-3 text-sm">
                              <span className="capitalize">
                                {donation.metadata?.source === 'web_donation' ? 'Website' : 
                                 donation.metadata?.source?.replace('_', ' ') || 'Website'}
                              </span>
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
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            </div>
          </TabsContent>

          {/* Add Offline Donation Tab */}
          <TabsContent value="offline">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-cyan-600" />
                  Add Offline Donation
                </CardTitle>
                <CardDescription>
                  Manually add donations from PayPal, LaunchGood, bank transfers, or cash
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    💡 Use this form to record donations received outside of the website (PayPal, LaunchGood, bank transfers, cash). 
                    These will be added to your total fundraising progress.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Donation Amount (£)</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={offlineDonation.amount}
                      onChange={(e) => setOfflineDonation({...offlineDonation, amount: e.target.value})}
                      placeholder="25.00"
                    />
                  </div>

                  <div>
                    <Label>Source</Label>
                    <select
                      value={offlineDonation.source}
                      onChange={(e) => setOfflineDonation({...offlineDonation, source: e.target.value})}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="paypal">PayPal</option>
                      <option value="launchgood">LaunchGood</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Note (Optional)</Label>
                  <Input
                    value={offlineDonation.note}
                    onChange={(e) => setOfflineDonation({...offlineDonation, note: e.target.value})}
                    placeholder="e.g., Monthly LaunchGood total, Donor name, etc."
                  />
                </div>

                <Button
                  onClick={handleAddOfflineDonation}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                  disabled={!offlineDonation.amount}
                >
                  Add £{offlineDonation.amount || '0'} Donation
                </Button>

                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Current Total Progress</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current:</span>
                      <span className="font-semibold">£{goal?.current_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Target:</span>
                      <span className="font-semibold">£{goal?.target_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress:</span>
                      <span className="font-semibold text-cyan-600">{goal?.percentage?.toFixed(1) || 0}%</span>
                    </div>
                  </div>
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
