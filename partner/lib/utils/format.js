// PATH: lib/utils/format.js

export const formatCurrency = (amount, symbol = 'K') =>
  `${symbol}${Number(amount ?? 0).toFixed(2)}`;

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const getPhoneDigits = (phone) => String(phone ?? '').replace(/\D/g, '');

export const getImageUrl = (image, format, base = '') => {
  if (!image) return null;
  if (format && image.formats?.[format]?.url) return `${base}${image.formats[format].url}`;
  if (image.url) return `${base}${image.url}`;
  return null;
};

export const getFloatColor = (balance) => {
  if (balance < 0) return '#EF4444';
  if (balance < 100) return '#F59E0B';
  if (balance < 500) return '#F59E0B';
  return '#10B981';
};

export const getPartnerFloatColor = (balance) => {
  if (balance < 500) return '#EF4444';
  if (balance < 2000) return '#F59E0B';
  return '#10B981';
};

export const getInsuranceChipProps = (expiryDate) => {
  if (!expiryDate) return { label: 'NOT SET', color: 'default' };
  const exp = new Date(expiryDate);
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (exp < now) return { label: 'EXPIRED', color: 'error' };
  if (exp < soon) return { label: 'EXPIRING SOON', color: 'warning' };
  return { label: 'VALID', color: 'success' };
};
