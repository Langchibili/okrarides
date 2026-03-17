// components/ui/index.js - Core UI Components

'use client';
import { Button as MuiButton, TextField, Card as MuiCard, Paper, Box, Typography, Avatar as MuiAvatar, Chip as MuiChip, Badge as MuiBadge, Skeleton as MuiSkeleton, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';

// ============= Button Component =============
export const Button = ({ 
  children, 
  variant = 'contained', 
  size = 'medium', 
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  ...props 
}) => {
  return (
    <motion.div
      whileTap={{ scale: loading ? 1 : 0.98 }}
      style={{ width: fullWidth ? '100%' : 'auto' }}
    >
      <MuiButton
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          <>
            {icon && iconPosition === 'left' && <Box sx={{ mr: 1, display: 'flex' }}>{icon}</Box>}
            {children}
            {icon && iconPosition === 'right' && <Box sx={{ ml: 1, display: 'flex' }}>{icon}</Box>}
          </>
        )}
      </MuiButton>
    </motion.div>
  );
};

// ============= Input Component =============
export const Input = ({ 
  label, 
  error, 
  helperText,
  icon,
  iconPosition = 'start',
  ...props 
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {label}
        </Typography>
      )}
      <TextField
        error={!!error}
        helperText={error || helperText}
        fullWidth
        InputProps={{
          ...(icon && iconPosition === 'start' && {
            startAdornment: <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>{icon}</Box>
          }),
          ...(icon && iconPosition === 'end' && {
            endAdornment: <Box sx={{ ml: 1, display: 'flex', color: 'text.secondary' }}>{icon}</Box>
          }),
        }}
        {...props}
      />
    </Box>
  );
};

// ============= Card Component =============
export const Card = ({ 
  children, 
  variant = 'elevation', 
  hoverable = false,
  onClick,
  ...props 
}) => {
  const Component = onClick ? motion.div : Box;
  
  return (
    <Component
      {...(onClick && {
        whileHover: hoverable ? { y: -4 } : {},
        whileTap: { scale: 0.98 },
        style: { cursor: 'pointer' }
      })}
    >
      <MuiCard
        variant={variant}
        onClick={onClick}
        sx={{
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          ...(hoverable && {
            '&:hover': {
              boxShadow: 6,
            }
          })
        }}
        {...props}
      >
        {children}
      </MuiCard>
    </Component>
  );
};

// ============= Avatar Component =============
export const Avatar = ({ src, alt, size = 'medium', ...props }) => {
  const sizes = {
    small: 32,
    medium: 40,
    large: 56,
    xlarge: 80,
  };

  return (
    <MuiAvatar
      src={src}
      alt={alt}
      sx={{ width: sizes[size], height: sizes[size] }}
      {...props}
    />
  );
};

// ============= Chip Component =============
export const Chip = ({ label, color = 'default', ...props }) => {
  return <MuiChip label={label} color={color} {...props} />;
};

// ============= Badge Component =============
export const Badge = ({ children, count = 0, ...props }) => {
  return (
    <MuiBadge badgeContent={count} color="error" {...props}>
      {children}
    </MuiBadge>
  );
};

// ============= Loading Skeleton =============
export const Skeleton = ({ variant = 'rectangular', width, height, ...props }) => {
  return (
    <MuiSkeleton
      variant={variant}
      width={width}
      height={height}
      animation="wave"
      {...props}
    />
  );
};

// ============= Empty State =============
export const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action,
  actionLabel = 'Take Action'
}) => {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        px: 3,
      }}
    >
      {icon && (
        <Box sx={{ fontSize: '4rem', mb: 2, opacity: 0.5 }}>
          {icon}
        </Box>
      )}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {description}
      </Typography>
      {action && (
        <Button onClick={action}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

// ============= Spinner =============
export const Spinner = ({ size = 40, ...props }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        py: 4,
      }}
    >
      <CircularProgress size={size} {...props} />
    </Box>
  );
};

// Export all components
export default {
  Button,
  Input,
  Card,
  Avatar,
  Chip,
  Badge,
  Skeleton,
  EmptyState,
  Spinner,
};
