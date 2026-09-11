'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  Chip,
  Rating as MuiRating,
} from '@mui/material';
import {
  Close as CloseIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { ridesAPI } from '@/lib/api/rides';
import { RATING_TAGS } from '@/Constants';
import useRide from '@/lib/hooks/useRide';
import { getImageUrl } from '@/Functions';

export const RatingModal = ({
  open,
  onClose,
  ride,
  driver,
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [driverProfilePic, setDriverProfilePic] = useState(null)
  const { loadRideDriverProfilePicUrl } = useRide()

  useEffect(()=>{
    const getDriverProfilePic = async () => {
      setDriverProfilePic(await loadRideDriverProfilePicUrl(ride?.driver?.id));
    }
    getDriverProfilePic();
  },[ride])

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      await ridesAPI.rateDriver(ride.id, rating, review, selectedTags);
      setSubmitted(true);
      
      // Close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  const availableTags = rating >= 4 ? RATING_TAGS.POSITIVE : RATING_TAGS.NEGATIVE;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 4,
          maxHeight: '90vh',
        },
      }}
    >
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="rating-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Box sx={{ p: 3 }}>
              {/* Header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Rate Your Trip
                </Typography>
                <IconButton onClick={handleClose} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>

              {/* Driver Info */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Avatar
                  src={process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_API_URL + getImageUrl(driverProfilePic, 'thumbnail')}
                  sx={{ width: 80, height: 80, mb: 2 }}
                >
                  {driver?.firstName?.[0]}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {driver?.firstName} {driver?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  How was your ride?
                </Typography>
              </Box>

              {/* Star Rating */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 3,
                }}
              >
                <MuiRating
                  value={rating}
                  onChange={(event, newValue) => {
                    setRating(newValue);
                    setSelectedTags([]); // Reset tags when rating changes
                  }}
                  size="large"
                  icon={<StarIcon fontSize="inherit" />}
                  emptyIcon={<StarBorderIcon fontSize="inherit" />}
                  sx={{
                    fontSize: '3rem',
                    '& .MuiRating-iconFilled': {
                      color: '#FFC107',
                    },
                  }}
                />
              </Box>

              {/* Rating Text */}
              {rating > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      textAlign: 'center',
                      mb: 3,
                      fontWeight: 600,
                      color: rating >= 4 ? 'success.main' : rating >= 3 ? 'warning.main' : 'error.main',
                    }}
                  >
                    {rating === 5 && '⭐ Excellent!'}
                    {rating === 4 && '👍 Good'}
                    {rating === 3 && '😐 Average'}
                    {rating === 2 && '👎 Below Average'}
                    {rating === 1 && '😔 Poor'}
                  </Typography>
                </motion.div>
              )}

              {/* Tags */}
              {rating > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1.5 }}
                  >
                    {rating >= 4 ? 'What did you like?' : 'What went wrong?'}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      mb: 3,
                    }}
                  >
                    {availableTags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onClick={() => handleTagToggle(tag)}
                        color={selectedTags.includes(tag) ? 'primary' : 'default'}
                        variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                        sx={{
                          fontWeight: selectedTags.includes(tag) ? 600 : 400,
                        }}
                      />
                    ))}
                  </Box>
                </motion.div>
              )}

              {/* Review Text */}
              {rating > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Share more details about your experience (optional)"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    sx={{ mb: 3 }}
                  />
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  disabled={rating === 0 || submitting}
                  sx={{
                    height: 56,
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </motion.div>

              {/* Skip */}
              <Button
                fullWidth
                variant="text"
                onClick={handleClose}
                disabled={submitting}
                sx={{
                  mt: 1,
                  textTransform: 'none',
                  color: 'text.secondary',
                }}
              >
                Skip for now
              </Button>
            </Box>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Box
              sx={{
                p: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {/* Success Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    mb: 3,
                  }}
                >
                  ✓
                </Box>
              </motion.div>

              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Thank You!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your feedback helps us improve
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default RatingModal;