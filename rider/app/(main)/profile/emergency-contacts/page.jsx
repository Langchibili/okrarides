// //Okrarides\rider\app\(main)\profile\emergency-contacts\page.jsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box,
//   Typography,
//   Paper,
//   IconButton,
//   Button,
//   Dialog,
//   TextField,
//   MenuItem,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   Chip,
// } from '@mui/material';
// import {
//   ArrowBack as BackIcon,
//   Add as AddIcon,
//   Phone as PhoneIcon,
//   Edit as EditIcon,
//   Delete as DeleteIcon,
//   Star as StarIcon,
// } from '@mui/icons-material';
// import { motion } from 'framer-motion';
// import { profileAPI } from '@/lib/api/profile';
// import { formatPhoneNumber, validatePhoneNumber } from '@/Functions';
// import { Spinner, EmptyState } from '@/components/ui';

// const relationships = [
//   'Family',
//   'Friend',
//   'Spouse',
//   'Parent',
//   'Sibling',
//   'Colleague',
//   'Other',
// ];

// export default function EmergencyContactsPage() {
//   const router = useRouter();
//   const [contacts, setContacts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showAddDialog, setShowAddDialog] = useState(false);
//   const [editingContact, setEditingContact] = useState(null);
//   const [formData, setFormData] = useState({
//     name: '',
//     phoneNumber: '',
//     relationship: 'Family',
//     isPrimary: false,
//   });

//   useEffect(() => {
//     loadContacts();
//   }, []);

//   const loadContacts = async () => {
//     try {
//       setLoading(true);
//       const data = await profileAPI.getEmergencyContacts();
//       setContacts(data);
//     } catch (error) {
//       console.error('Error loading contacts:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSaveContact = async () => {
//     if (!formData.name || !formData.phoneNumber) {
//       alert('Please fill in all fields');
//       return;
//     }

//     const cleanPhone = formData.phoneNumber.replace(/\D/g, '');
//     if (!validatePhoneNumber(cleanPhone)) {
//       alert('Please enter a valid 9-digit phone number');
//       return;
//     }

//     try {
//       const contactData = {
//         ...formData,
//         phoneNumber: `+260${cleanPhone}`,
//       };

//       if (editingContact) {
//         await profileAPI.updateEmergencyContact(editingContact.id, contactData);
//       } else {
//         await profileAPI.addEmergencyContact(contactData);
//       }

//       setShowAddDialog(false);
//       setFormData({ name: '', phoneNumber: '', relationship: 'Family', isPrimary: false });
//       setEditingContact(null);
//       loadContacts();
//     } catch (error) {
//       alert('Failed to save contact');
//     }
//   };

//   const handleEditContact = (contact) => {
//     setEditingContact(contact);
//     setFormData({
//       name: contact.name,
//       phoneNumber: contact.phoneNumber.replace('+260', ''),
//       relationship: contact.relationship,
//       isPrimary: contact.isPrimary,
//     });
//     setShowAddDialog(true);
//   };

//   const handleDeleteContact = async (id) => {
//     if (!confirm('Are you sure you want to delete this contact?')) return;

//     try {
//       await profileAPI.deleteEmergencyContact(id);
//       loadContacts();
//     } catch (error) {
//       alert('Failed to delete contact');
//     }
//   };

//   const handleCallContact = (phoneNumber) => {
//     window.location.href = `tel:${phoneNumber}`;
//   };

//   return (
//     <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
//       {/* Header */}
//       <Box
//         sx={{
//           p: 2,
//           bgcolor: 'background.paper',
//           borderBottom: 1,
//           borderColor: 'divider',
//           display: 'flex',
//           alignItems: 'center',
//           gap: 2,
//         }}
//       >
//         <IconButton onClick={() => router.back()} edge="start">
//           <BackIcon />
//         </IconButton>
//         <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
//           Emergency Contacts
//         </Typography>
//         <IconButton onClick={() => setShowAddDialog(true)}>
//           <AddIcon />
//         </IconButton>
//       </Box>

//       <Box sx={{ p: 2 }}>
//         {/* Info Card */}
//         <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light', color: 'info.dark' }}>
//           <Typography variant="caption">
//             🛡️ <strong>Safety First:</strong> These contacts can track your rides and will be
//             notified in case of emergencies.
//           </Typography>
//         </Paper>

//         {loading ? (
//           <Spinner />
//         ) : contacts.length === 0 ? (
//           <EmptyState
//             icon={<PhoneIcon sx={{ fontSize: '4rem' }} />}
//             title="No emergency contacts"
//             description="Add trusted contacts who can be reached in case of emergencies"
//             action={() => setShowAddDialog(true)}
//             actionLabel="Add Contact"
//           />
//         ) : (
//           <List disablePadding>
//             {contacts.map((contact, index) => (
//               <motion.div
//                 key={contact.id}
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: index * 0.05 }}
//               >
//                 <Paper sx={{ mb: 2 }}>
//                   <ListItem>
//                     <ListItemIcon>
//                       <Box
//                         sx={{
//                           width: 48,
//                           height: 48,
//                           borderRadius: 2,
//                           bgcolor: contact.isPrimary ? 'primary.light' : 'action.hover',
//                           display: 'flex',
//                           alignItems: 'center',
//                           justifyContent: 'center',
//                           color: contact.isPrimary ? 'primary.dark' : 'text.secondary',
//                         }}
//                       >
//                         {contact.isPrimary ? <StarIcon /> : <PhoneIcon />}
//                       </Box>
//                     </ListItemIcon>
//                     <ListItemText
//                       primary={
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                           <Typography variant="body1" sx={{ fontWeight: 600 }}>
//                             {contact.name}
//                           </Typography>
//                           {contact.isPrimary && (
//                             <Chip label="Primary" size="small" color="primary" />
//                           )}
//                         </Box>
//                       }
//                       secondary={
//                         <>
//                           {formatPhoneNumber(contact.phoneNumber)}
//                           <br />
//                           {contact.relationship}
//                         </>
//                       }
//                     />
//                     <IconButton onClick={() => handleCallContact(contact.phoneNumber)}>
//                       <PhoneIcon />
//                     </IconButton>
//                     <IconButton onClick={() => handleEditContact(contact)} size="small">
//                       <EditIcon />
//                     </IconButton>
//                     <IconButton onClick={() => handleDeleteContact(contact.id)} size="small">
//                       <DeleteIcon />
//                     </IconButton>
//                   </ListItem>
//                 </Paper>
//               </motion.div>
//             ))}
//           </List>
//         )}

//         {contacts.length > 0 && contacts.length < 5 && (
//           <Button
//             fullWidth
//             variant="outlined"
//             startIcon={<AddIcon />}
//             onClick={() => setShowAddDialog(true)}
//             sx={{ height: 48, mt: 2 }}
//           >
//             Add Contact
//           </Button>
//         )}
//       </Box>

//       {/* Add/Edit Dialog */}
//       <Dialog
//         open={showAddDialog}
//         onClose={() => {
//           setShowAddDialog(false);
//           setEditingContact(null);
//           setFormData({ name: '', phoneNumber: '', relationship: 'Family', isPrimary: false });
//         }}
//         fullWidth
//         maxWidth="sm"
//       >
//         <Box sx={{ p: 3 }}>
//           <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
//             {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
//           </Typography>

//           <TextField
//             fullWidth
//             label="Full Name"
//             value={formData.name}
//             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//             sx={{ mb: 2 }}
//           />

//           <TextField
//             fullWidth
//             label="Phone Number"
//             value={formData.phoneNumber}
//             onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
//             placeholder="972612345"
//             InputProps={{
//               startAdornment: (
//                 <Box sx={{ mr: 1, color: 'text.secondary' }}>+260</Box>
//               ),
//             }}
//             sx={{ mb: 2 }}
//           />

//           <TextField
//             select
//             fullWidth
//             label="Relationship"
//             value={formData.relationship}
//             onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
//             sx={{ mb: 2 }}
//           >
//             {relationships.map((rel) => (
//               <MenuItem key={rel} value={rel}>
//                 {rel}
//               </MenuItem>
//             ))}
//           </TextField>

//           <Paper
//             onClick={() => setFormData({ ...formData, isPrimary: !formData.isPrimary })}
//             sx={{
//               p: 2,
//               display: 'flex',
//               alignItems: 'center',
//               cursor: 'pointer',
//               border: 2,
//               borderColor: formData.isPrimary ? 'primary.main' : 'divider',
//               mb: 3,
//             }}
//           >
//             <Box sx={{ flex: 1 }}>
//               <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                 Primary Contact
//               </Typography>
//               <Typography variant="caption" color="text.secondary">
//                 Will be notified first in emergencies
//               </Typography>
//             </Box>
//             <Chip
//               label={formData.isPrimary ? 'Yes' : 'No'}
//               color={formData.isPrimary ? 'primary' : 'default'}
//               size="small"
//             />
//           </Paper>

//           <Box sx={{ display: 'flex', gap: 2 }}>
//             <Button
//               fullWidth
//               variant="outlined"
//               onClick={() => {
//                 setShowAddDialog(false);
//                 setEditingContact(null);
//                 setFormData({ name: '', phoneNumber: '', relationship: 'Family', isPrimary: false });
//               }}
//             >
//               Cancel
//             </Button>
//             <Button fullWidth variant="contained" onClick={handleSaveContact}>
//               {editingContact ? 'Update' : 'Save'}
//             </Button>
//           </Box>
//         </Box>
//       </Dialog>
//     </Box>
//   );
// }

'use client';
// PATH: rider/app/(main)/profile/emergency-contacts/page.jsx
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
  Chip,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Shield as ShieldIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { ShimmerDiv } from 'shimmer-effects-react';
import { profileAPI } from '@/lib/api/profile';
import { formatPhoneNumber, validatePhoneNumber } from '@/Functions';
import { EmptyState } from '@/components/ui';

const relationships = ['Family', 'Friend', 'Spouse', 'Parent', 'Sibling', 'Colleague', 'Other'];

const ContactSkeleton = ({ mode }) => (
  <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'background.paper', mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
    <ShimmerDiv mode={mode} height={52} width={52} rounded={1} />
    <Box sx={{ flex: 1 }}>
      <ShimmerDiv mode={mode} height={16} width={130} rounded={1} />
      <Box sx={{ mt: 1 }}>
        <ShimmerDiv mode={mode} height={13} width={100} rounded={1} />
      </Box>
      <Box sx={{ mt: 1 }}>
        <ShimmerDiv mode={mode} height={12} width={70} rounded={1} />
      </Box>
    </Box>
    <Box sx={{ display: 'flex', gap: 1 }}>
      <ShimmerDiv mode={mode} height={36} width={36} rounded={1} />
      <ShimmerDiv mode={mode} height={36} width={36} rounded={1} />
    </Box>
  </Box>
);

export default function EmergencyContactsPage() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const shimmerMode = theme.palette.mode;

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', relationship: 'Family', isPrimary: false });

  useEffect(() => { loadContacts(); }, []);

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
    if (!formData.name || !formData.phoneNumber) { alert('Please fill in all fields'); return; }
    const cleanPhone = formData.phoneNumber.replace(/\D/g, '');
    if (!validatePhoneNumber(cleanPhone)) { alert('Please enter a valid 9-digit phone number'); return; }
    try {
      const contactData = { ...formData, phoneNumber: `+260${cleanPhone}` };
      if (editingContact) {
        await profileAPI.updateEmergencyContact(editingContact.id, contactData);
      } else {
        await profileAPI.addEmergencyContact(contactData);
      }
      setShowAddDialog(false);
      setFormData({ name: '', phoneNumber: '', relationship: 'Family', isPrimary: false });
      setEditingContact(null);
      loadContacts();
    } catch { alert('Failed to save contact'); }
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setFormData({ name: contact.name, phoneNumber: contact.phoneNumber.replace('+260', ''), relationship: contact.relationship, isPrimary: contact.isPrimary });
    setShowAddDialog(true);
  };

  const handleDeleteContact = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try { await profileAPI.deleteEmergencyContact(id); loadContacts(); }
    catch { alert('Failed to delete contact'); }
  };

  const handleCallContact = (phoneNumber) => { window.location.href = `tel:${phoneNumber}`; };

  const closeDialog = () => {
    setShowAddDialog(false);
    setEditingContact(null);
    setFormData({ name: '', phoneNumber: '', relationship: 'Family', isPrimary: false });
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          flexShrink: 0,
          background: isDark
            ? 'linear-gradient(160deg, #1C1C1C 0%, #141414 100%)'
            : 'linear-gradient(160deg, #FFFFFF 0%, #F8F8F8 100%)',
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.06)',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #E91E63 0%, #FF5722 100%)' }} />
        <IconButton
          onClick={() => router.back()}
          sx={{
            bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
            width: 38, height: 38,
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)' },
          }}
        >
          <BackIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1, letterSpacing: -0.3 }}>
          Emergency Contacts
        </Typography>
        <motion.div whileTap={{ scale: 0.9 }}>
          <IconButton
            onClick={() => setShowAddDialog(true)}
            sx={{
              background: 'linear-gradient(135deg, #E91E63 0%, #FF5722 100%)',
              color: '#fff',
              width: 38,
              height: 38,
              boxShadow: '0 4px 12px rgba(233,30,99,0.35)',
              '&:hover': { transform: 'scale(1.06)' },
              transition: 'all 0.18s ease',
            }}
          >
            <AddIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </motion.div>
      </Box>

      {/* ── Scrollable Content ──────────────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          px: 2,
          pt: 2,
          pb: 3,
        }}
      >
        {/* Info banner */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Box
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 3,
              background: isDark
                ? 'linear-gradient(135deg, rgba(233,30,99,0.15) 0%, rgba(255,87,34,0.08) 100%)'
                : 'linear-gradient(135deg, rgba(233,30,99,0.08) 0%, rgba(255,87,34,0.04) 100%)',
              border: '1px solid',
              borderColor: 'rgba(233,30,99,0.2)',
              display: 'flex',
              gap: 1.5,
              alignItems: 'flex-start',
            }}
          >
            <ShieldIcon sx={{ color: '#E91E63', fontSize: 20, flexShrink: 0, mt: 0.1 }} />
            <Typography variant="caption" sx={{ fontWeight: 500, lineHeight: 1.5, color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>
              <strong>Safety First:</strong> These contacts can track your rides and will be notified in emergencies.
            </Typography>
          </Box>
        </motion.div>

        {loading ? (
          <Box>
            {[1, 2, 3].map((i) => <ContactSkeleton key={i} mode={shimmerMode} />)}
          </Box>
        ) : contacts.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <Box sx={{ pt: 4 }}>
              <EmptyState
                icon={<PhoneIcon sx={{ fontSize: '4rem', opacity: 0.4 }} />}
                title="No emergency contacts"
                description="Add trusted contacts who can be reached in emergencies"
                action={() => setShowAddDialog(true)}
                actionLabel="Add Contact"
              />
            </Box>
          </motion.div>
        ) : (
          <List disablePadding>
            <AnimatePresence>
              {contacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      mb: 2,
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: contact.isPrimary
                        ? 'rgba(233,30,99,0.3)'
                        : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                      boxShadow: contact.isPrimary
                        ? '0 4px 20px rgba(233,30,99,0.15)'
                        : isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.05)',
                      position: 'relative',
                      '&::before': contact.isPrimary ? {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        background: 'linear-gradient(180deg, #E91E63 0%, #FF5722 100%)',
                      } : {},
                    }}
                  >
                    <Box sx={{ p: 2, pl: contact.isPrimary ? 2.5 : 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {/* Avatar icon */}
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 2.5,
                          flexShrink: 0,
                          background: contact.isPrimary
                            ? 'linear-gradient(135deg, rgba(233,30,99,0.2) 0%, rgba(255,87,34,0.1) 100%)'
                            : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                          border: '1px solid',
                          borderColor: contact.isPrimary ? 'rgba(233,30,99,0.3)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: contact.isPrimary ? '#E91E63' : 'text.secondary',
                        }}
                      >
                        {contact.isPrimary
                          ? <StarIcon sx={{ fontSize: 22 }} />
                          : <PersonIcon sx={{ fontSize: 22 }} />
                        }
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, letterSpacing: -0.2 }}>
                            {contact.name}
                          </Typography>
                          {contact.isPrimary && (
                            <Chip
                              label="Primary"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #E91E63 0%, #FF5722 100%)',
                                color: '#fff',
                                boxShadow: '0 2px 6px rgba(233,30,99,0.35)',
                              }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 500, fontSize: '0.78rem', display: 'block' }}>
                          {formatPhoneNumber(contact.phoneNumber)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.72rem' }}>
                          {contact.relationship}
                        </Typography>
                      </Box>

                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                        <motion.div whileTap={{ scale: 0.88 }}>
                          <IconButton
                            onClick={() => handleCallContact(contact.phoneNumber)}
                            size="small"
                            sx={{
                              bgcolor: 'success.main',
                              color: '#fff',
                              width: 34,
                              height: 34,
                              '&:hover': { bgcolor: 'success.dark', transform: 'scale(1.08)' },
                              transition: 'all 0.16s ease',
                            }}
                          >
                            <PhoneIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.88 }}>
                          <IconButton
                            onClick={() => handleEditContact(contact)}
                            size="small"
                            sx={{
                              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                              width: 34,
                              height: 34,
                              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)' },
                            }}
                          >
                            <EditIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.88 }}>
                          <IconButton
                            onClick={() => handleDeleteContact(contact.id)}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(244,67,54,0.1)',
                              color: 'error.main',
                              width: 34,
                              height: 34,
                              '&:hover': { bgcolor: 'rgba(244,67,54,0.18)' },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </motion.div>
                      </Box>
                    </Box>
                  </Paper>
                </motion.div>
              ))}
            </AnimatePresence>

            {contacts.length > 0 && contacts.length < 5 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddDialog(true)}
                  sx={{
                    height: 50,
                    mt: 1,
                    borderRadius: 3,
                    fontWeight: 600,
                    borderWidth: 1.5,
                    borderColor: 'rgba(233,30,99,0.4)',
                    color: '#E91E63',
                    '&:hover': { borderWidth: 1.5, borderColor: '#E91E63', background: 'rgba(233,30,99,0.06)' },
                  }}
                >
                  Add Another Contact
                </Button>
              </motion.div>
            )}
          </List>
        )}
      </Box>

      {/* ── Add / Edit Dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={showAddDialog}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.6)' : '0 24px 64px rgba(0,0,0,0.15)',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5, letterSpacing: -0.3 }}>
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
            InputProps={{ startAdornment: <Box sx={{ mr: 1, color: 'text.secondary', fontWeight: 600 }}>+260</Box> }}
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
            {relationships.map((rel) => <MenuItem key={rel} value={rel}>{rel}</MenuItem>)}
          </TextField>

          {/* Primary toggle */}
          <Paper
            onClick={() => setFormData({ ...formData, isPrimary: !formData.isPrimary })}
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              borderRadius: 2.5,
              border: '1.5px solid',
              borderColor: formData.isPrimary ? '#E91E63' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              background: formData.isPrimary
                ? (isDark ? 'rgba(233,30,99,0.12)' : 'rgba(233,30,99,0.05)')
                : 'transparent',
              transition: 'all 0.18s ease',
              mb: 3,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Primary Contact</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>Will be notified first in emergencies</Typography>
            </Box>
            <Chip
              label={formData.isPrimary ? 'Yes' : 'No'}
              size="small"
              sx={{
                fontWeight: 700,
                background: formData.isPrimary
                  ? 'linear-gradient(135deg, #E91E63 0%, #FF5722 100%)'
                  : undefined,
                color: formData.isPrimary ? '#fff' : undefined,
              }}
            />
          </Paper>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button fullWidth variant="outlined" onClick={closeDialog} sx={{ height: 48, borderRadius: 2.5, fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSaveContact}
              sx={{
                height: 48,
                borderRadius: 2.5,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #E91E63 0%, #FF5722 100%)',
                boxShadow: '0 4px 12px rgba(233,30,99,0.35)',
              }}
            >
              {editingContact ? 'Update' : 'Save'}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}