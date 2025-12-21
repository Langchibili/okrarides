'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  Dialog,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { profileAPI } from '@/lib/api/profile';
import { formatPhoneNumber, validatePhoneNumber } from '@/Functions';
import { Spinner, EmptyState } from '@/components/ui';

const relationships = [
  'Family',
  'Friend',
  'Spouse',
  'Parent',
  'Sibling',
  'Colleague',
  'Other',
];

export default function EmergencyContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    relationship: 'Family',
    isPrimary: false,
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await profileAPI.getEmergencyContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async () => {
    if (!formData.name || !formData.phoneNumber) {
      alert('Please fill in all fields');
      return;
    }

    const cleanPhone = formData.phoneNumber.replace(/\D/g, '');
    if (!validatePhoneNumber(cleanPhone)) {
      alert('Please enter a valid 9-digit phone number');
      return;
    }

    try {
      const contactData = {
        ...formData,
        phoneNumber: `+260${cleanPhone}`,
      };

      if (editingContact) {
        await profileAPI.updateEmergencyContact(editingContact.id, contactData);
      } else {
        await profileAPI.addEmergencyContact(contactData);
      }

      setShowAddDialog(false);
      setFormData({ name: '', phoneNumber: '', relationship: 'Family', isPrimary: false });
      setEditingContact(null);
      loadContacts();
    } catch (error) {
      alert('Failed to save contact');
    }
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phoneNumber: contact.phoneNumber.replace('+260', ''),
      relationship: contact.relationship,
      isPrimary: contact.isPrimary,
    });
    setShowAddDialog(true);
  };

  const handleDeleteContact = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      await profileAPI.deleteEmergencyContact(id);
      loadContacts();
    } catch (error) {
      alert('Failed to delete contact');
    }
  };

  const handleCallContact = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <IconButton onClick={() => router.back()} edge="start">
          <BackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
          Emergency Contacts
        </Typography>
        <IconButton onClick={() => setShowAddDialog(true)}>
          <AddIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* Info Card */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light', color: 'info.dark' }}>
          <Typography variant="caption">
            🛡️ <strong>Safety First:</strong> These contacts can track your rides and will be
            notified in case of emergencies.
          </Typography>
        </Paper>

        {loading ? (
          <Spinner />
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={<PhoneIcon sx={{ fontSize: '4rem' }} />}
            title="No emergency contacts"
            description="Add trusted contacts who can be reached in case of emergencies"
            action={() => setShowAddDialog(true)}
            actionLabel="Add Contact"
          />
        ) : (
          <List disablePadding>
            {contacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Paper sx={{ mb: 2 }}>
                  <ListItem>
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: contact.isPrimary ? 'primary.light' : 'action.hover',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: contact.isPrimary ? 'primary.dark' : 'text.secondary',
                        }}
                      >
                        {contact.isPrimary ? <StarIcon /> : <PhoneIcon />}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {contact.name}
                          </Typography>
                          {contact.isPrimary && (
                            <Chip label="Primary" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          {formatPhoneNumber(contact.phoneNumber)}
                          <br />
                          {contact.relationship}
                        </>
                      }
                    />
                    <IconButton onClick={() => handleCallContact(contact.phoneNumber)}>
                      <PhoneIcon />
                    </IconButton>
                    <IconButton onClick={() => handleEditContact(contact)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteContact(contact.id)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                </Paper>
              </motion.div>
            ))}
          </List>
        )}

        {contacts.length > 0 && contacts.length < 5 && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowAddDialog(true)}
            sx={{ height: 48, mt: 2 }}
          >
            Add Contact
          </Button>
        )}
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setEditingContact(null);
          setFormData({ name: '', phoneNumber: '', relationship: 'Family', isPrimary: false });
        }}
        fullWidth
        maxWidth="sm"
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
          </Typography>

          <TextField
            fullWidth
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            placeholder="972612345"
            InputProps={{
              startAdornment: (
                <Box sx={{ mr: 1, color: 'text.secondary' }}>+260</Box>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            select
            fullWidth
            label="Relationship"
            value={formData.relationship}
            onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
            sx={{ mb: 2 }}
          >
            {relationships.map((rel) => (
              <MenuItem key={rel} value={rel}>
                {rel}
              </MenuItem>
            ))}
          </TextField>

          <Paper
            onClick={() => setFormData({ ...formData, isPrimary: !formData.isPrimary })}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              border: 2,
              borderColor: formData.isPrimary ? 'primary.main' : 'divider',
              mb: 3,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Primary Contact
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Will be notified first in emergencies
              </Typography>
            </Box>
            <Chip
              label={formData.isPrimary ? 'Yes' : 'No'}
              color={formData.isPrimary ? 'primary' : 'default'}
              size="small"
            />
          </Paper>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setShowAddDialog(false);
                setEditingContact(null);
                setFormData({ name: '', phoneNumber: '', relationship: 'Family', isPrimary: false });
              }}
            >
              Cancel
            </Button>
            <Button fullWidth variant="contained" onClick={handleSaveContact}>
              {editingContact ? 'Update' : 'Save'}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
