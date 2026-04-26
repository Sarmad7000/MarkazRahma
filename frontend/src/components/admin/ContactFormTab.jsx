import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Settings, Plus, X, Trash2, Eye, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

const ContactFormTab = ({ 
  submissions, 
  settings,
  onUpdateSettings, 
  onUpdateSubmission, 
  onDeleteSubmission 
}) => {
  const [editingOptions, setEditingOptions] = useState(false);
  const [reasonOptions, setReasonOptions] = useState(settings?.reason_options || []);
  const [emailRecipient, setEmailRecipient] = useState(settings?.email_recipient || '');
  const [googleSheetId, setGoogleSheetId] = useState(settings?.google_sheet_id || '');
  const [googleCredentials, setGoogleCredentials] = useState(settings?.google_credentials_json || '');
  const [newReason, setNewReason] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);

  const handleAddReason = () => {
    if (!newReason.trim()) {
      toast.error('Please enter a reason');
      return;
    }
    
    if (reasonOptions.includes(newReason.trim())) {
      toast.error('This reason already exists');
      return;
    }

    setReasonOptions([...reasonOptions, newReason.trim()]);
    setNewReason('');
  };

  const handleRemoveReason = (reason) => {
    setReasonOptions(reasonOptions.filter(r => r !== reason));
  };

  const handleSaveOptions = async () => {
    if (reasonOptions.length === 0) {
      toast.error('You must have at least one reason option');
      return;
    }

    try {
      const settings = {
        reason_options: reasonOptions
      };
      
      if (emailRecipient) settings.email_recipient = emailRecipient;
      if (googleSheetId) settings.google_sheet_id = googleSheetId;
      if (googleCredentials) settings.google_credentials_json = googleCredentials;
      
      await onUpdateSettings(settings);
      setEditingOptions(false);
      toast.success('Form settings updated successfully');
    } catch (error) {
      console.error('Error saving options:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleCancelEdit = () => {
    setReasonOptions(settings?.reason_options || []);
    setNewReason('');
    setEditingOptions(false);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await onUpdateSubmission(id, { status: 'read' });
      toast.success('Marked as read');
    } catch (error) {
      console.error('Error updating submission:', error);
      toast.error('Failed to update');
    }
  };

  const handleMarkAsResolved = async (id) => {
    try {
      await onUpdateSubmission(id, { status: 'resolved' });
      toast.success('Marked as resolved');
    } catch (error) {
      console.error('Error updating submission:', error);
      toast.error('Failed to update');
    }
  };

  const confirmDelete = (id) => {
    setSubmissionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await onDeleteSubmission(submissionToDelete);
      setDeleteDialogOpen(false);
      setSubmissionToDelete(null);
      toast.success('Submission deleted');
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Failed to delete');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'read':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card className="border-cyan-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-cyan-600" />
            Form Settings
          </CardTitle>
          <CardDescription>Customize the dropdown options for the contact form</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingOptions ? (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Reason Options</Label>
                <div className="flex flex-wrap gap-2">
                  {reasonOptions.map((reason) => (
                    <Badge
                      key={reason}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1.5"
                    >
                      {reason}
                      <button
                        onClick={() => handleRemoveReason(reason)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Add new reason..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddReason()}
                />
                <Button onClick={handleAddReason} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="email-recipient">Email Recipient (where submissions go)</Label>
                  <Input
                    id="email-recipient"
                    type="email"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    placeholder="info@markazrahma.org"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sheet-id">Google Sheet ID (optional)</Label>
                  <Input
                    id="sheet-id"
                    value={googleSheetId}
                    onChange={(e) => setGoogleSheetId(e.target.value)}
                    placeholder="16IWp53fHr8rJ5zasrEQmUofj9YaPVAn_MkrFrSMktj4"
                  />
                  <p className="text-xs text-gray-500">Find this in your Google Sheet URL</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google-creds">Google Service Account JSON (optional)</Label>
                  <textarea
                    id="google-creds"
                    value={googleCredentials}
                    onChange={(e) => setGoogleCredentials(e.target.value)}
                    placeholder='Paste the entire JSON file contents here...'
                    className="w-full min-h-[100px] p-2 border rounded text-xs font-mono"
                  />
                  <p className="text-xs text-gray-500">This enables automatic Google Sheets sync</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveOptions} className="bg-cyan-600 hover:bg-cyan-700">
                  Save Changes
                </Button>
                <Button onClick={handleCancelEdit} variant="outline">
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Reason Options:</Label>
                <div className="flex flex-wrap gap-2">
                  {(settings?.reason_options || []).map((reason) => (
                    <Badge key={reason} variant="secondary" className="px-3 py-1.5">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button onClick={() => setEditingOptions(true)} className="bg-cyan-600 hover:bg-cyan-700">
                <Settings className="h-4 w-4 mr-2" />
                Edit Options
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Submissions Card */}
      <Card className="border-cyan-200">
        <CardHeader>
          <CardTitle>Contact Form Submissions</CardTitle>
          <CardDescription>
            {submissions?.length || 0} total submission{submissions?.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!submissions || submissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No submissions yet
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Card key={submission.id} className="border-gray-200">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-lg">{submission.name}</h4>
                            <Badge className={getStatusColor(submission.status)}>
                              {submission.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {submission.location}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(submission.created_at)}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {submission.status === 'new' && (
                            <Button
                              onClick={() => handleMarkAsRead(submission.id)}
                              size="sm"
                              variant="outline"
                              className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Mark Read
                            </Button>
                          )}
                          {submission.status !== 'resolved' && (
                            <Button
                              onClick={() => handleMarkAsResolved(submission.id)}
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          )}
                          <Button
                            onClick={() => confirmDelete(submission.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Reason:</span>
                          <p className="text-gray-900">{submission.reason}</p>
                        </div>
                        {submission.email && (
                          <div>
                            <span className="font-medium text-gray-700">Email:</span>
                            <p className="text-gray-900">{submission.email}</p>
                          </div>
                        )}
                        {submission.phone && (
                          <div>
                            <span className="font-medium text-gray-700">Phone:</span>
                            <p className="text-gray-900">{submission.phone}</p>
                          </div>
                        )}
                      </div>

                      {submission.message && (
                        <div>
                          <span className="font-medium text-gray-700 text-sm">Message:</span>
                          <p className="text-gray-900 mt-1 text-sm bg-gray-50 p-3 rounded">
                            {submission.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this submission? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContactFormTab;
