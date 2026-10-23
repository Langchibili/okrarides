'use client';

import { useEffect, useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { apiClient } from '@/lib/api/client';

function getNumber(value) {
  if (!value) return '';
  return typeof value === 'object' ? value.number ?? value.value ?? '' : value;
}

export default function PartnerFloatTopupDialog({ open, onClose, user, adminSupportNumbers = [] }) {
  const [partner, setPartner] = useState(user?.partner ?? null);

  useEffect(() => {
    setPartner(user?.partner ?? null);
    if (!open || !user?.id || user.partner?.partnerProfile) return undefined;

    let active = true;
    apiClient.get(`/users/${user.id}?populate[partner][populate][partnerProfile]=true`)
      .then((userData) => {
        if (active) setPartner(userData?.partner ?? userData?.data?.partner ?? null);
      })
      .catch((error) => {
        console.error('[PartnerFloatTopupDialog] Failed to load partner contact:', error);
      });

    return () => { active = false; };
  }, [open, user?.id, user?.partner]);

  const profile = partner?.partnerProfile ?? {};
  const partnerNumber = profile.businessPhone || partner?.phoneNumber || profile.whatsappNumber || '';
  const partnerWhatsApp = profile.whatsappNumber || profile.businessPhone || partner?.phoneNumber || '';
  const supportNumber = (Array.isArray(adminSupportNumbers) ? adminSupportNumbers : []).map(getNumber).find(Boolean) || '';
  const contactNumber = partnerNumber || supportNumber;
  const whatsappContact = partnerWhatsApp || supportNumber;
  const isPartnerContact = Boolean(partnerNumber);
  const whatsappNumber = String(whatsappContact).replace(/\D/g, '');
  const title = isPartnerContact ? 'Contact your partner company' : 'Contact Okra support';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          To top up your float balance, contact your partner company.
        </Typography>
        {contactNumber ? (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              {isPartnerContact ? profile.businessName || 'Partner company' : 'Support phone'}
            </Typography>
            <Button component="a" href={`tel:${contactNumber}`} variant="outlined">
              {contactNumber}
            </Button>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No contact phone is available. Please contact support through the Help page.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {whatsappContact && (
          <Button
            component="a"
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello, I need help topping up my float balance.')}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            color="success"
            startIcon={<WhatsAppIcon />}
          >
            {isPartnerContact ? 'Message partner on WhatsApp' : 'Message support on WhatsApp'}
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
