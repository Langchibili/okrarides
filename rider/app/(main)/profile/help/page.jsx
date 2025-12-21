'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Button,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ExpandMore as ExpandIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const faqs = [
  {
    question: 'How do I book a ride?',
    answer: 'Open the app, enter your pickup and dropoff locations, select your preferred vehicle type, and tap "Confirm Ride". A driver will be assigned to you shortly.',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept Cash, OkraPay wallet, and Mobile Money (MTN, Airtel, Zamtel). You can manage your payment methods in the Wallet section.',
  },
  {
    question: 'How do I cancel a ride?',
    answer: 'You can cancel a ride before the driver arrives by tapping the "Cancel Ride" button on the tracking screen. Please note that cancellation fees may apply.',
  },
  {
    question: 'How does the referral program work?',
    answer: 'Share your referral code with friends. When they sign up and complete their first ride, you both earn bonus credits. Check the Refer & Earn section for more details.',
  },
  {
    question: 'How can I rate my driver?',
    answer: 'After each completed ride, you\'ll be prompted to rate your driver on a scale of 1-5 stars and leave optional feedback.',
  },
  {
    question: 'What if I left something in the vehicle?',
    answer: 'Contact the driver directly through the app or reach out to our support team immediately. We\'ll help you retrieve your lost items.',
  },
  {
    question: 'How do I add money to my wallet?',
    answer: 'Go to Wallet > Top Up, enter the amount, and choose your payment method. Follow the prompts to complete the transaction.',
  },
  {
    question: 'Is my trip insured?',
    answer: 'Yes, all rides on Okra are covered by insurance for your safety and peace of mind.',
  },
];

const contactMethods = [
  {
    icon: <PhoneIcon />,
    title: 'Phone Support',
    subtitle: '+260 XXX XXX XXX',
    action: () => (window.location.href = 'tel:+260XXXXXXXXX'),
    color: '#4CAF50',
  },
  {
    icon: <EmailIcon />,
    title: 'Email Support',
    subtitle: 'support@okrarides.com',
    action: () => (window.location.href = 'mailto:support@okrarides.com'),
    color: '#2196F3',
  },
  {
    icon: <WhatsAppIcon />,
    title: 'WhatsApp',
    subtitle: 'Chat with us',
    action: () => window.open('https://wa.me/260XXXXXXXXX', '_blank'),
    color: '#25D366',
  },
];

export default function HelpPage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Help Center
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
        />

        {/* Contact Support */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Contact Support
        </Typography>
        <List disablePadding sx={{ mb: 3 }}>
          {contactMethods.map((method, index) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Paper
                sx={{
                  mb: 2,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={method.action}
              >
                <ListItem>
                  <ListItemIcon>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: `${method.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: method.color,
                      }}
                    >
                      {method.icon}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={method.title}
                    secondary={method.subtitle}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItem>
              </Paper>
            </motion.div>
          ))}
        </List>

        {/* FAQs */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Frequently Asked Questions
        </Typography>
        {filteredFaqs.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <HelpIcon sx={{ fontSize: '3rem', color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary">No results found</Typography>
          </Paper>
        ) : (
          filteredFaqs.map((faq, index) => (
            <Accordion
              key={index}
              expanded={expanded === `panel${index}`}
              onChange={handleChange(`panel${index}`)}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography sx={{ fontWeight: 600 }}>{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>
    </Box>
  );
}
