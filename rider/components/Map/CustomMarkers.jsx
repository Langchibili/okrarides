
// import { useTheme } from '@mui/material';

// // Create custom marker icon
// export const createCustomMarker = (type, theme) => {
//   const colors = {
//     pickup: theme.palette.success.main,
//     dropoff: theme.palette.error.main,
//     driver: theme.palette.primary.main,
//     station: theme.palette.info.main,
//   };
  
//   const color = colors[type] || theme.palette.primary.main;
  
//   return {
//     path: window.google.maps.SymbolPath.CIRCLE,
//     fillColor: color,
//     fillOpacity: 1,
//     strokeColor: '#FFFFFF',
//     strokeWeight: 3,
//     scale: 10,
//   };
// };

// // Animated pulse marker for live tracking
// export const createPulseMarker = (color) => {
//   const canvas = document.createElement('canvas');
//   canvas.width = 40;
//   canvas.height = 40;
//   const ctx = canvas.getContext('2d');
  
//   // Draw outer pulse circle
//   ctx.beginPath();
//   ctx.arc(20, 20, 15, 0, 2 * Math.PI);
//   ctx.fillStyle = `${color}33`;
//   ctx.fill();
  
//   // Draw inner solid circle
//   ctx.beginPath();
//   ctx.arc(20, 20, 8, 0, 2 * Math.PI);
//   ctx.fillStyle = color;
//   ctx.fill();
  
//   // White border
//   ctx.strokeStyle = '#FFFFFF';
//   ctx.lineWidth = 2;
//   ctx.stroke();
  
//   return canvas.toDataURL();
// };

// // Car marker with rotation
// export const createCarMarker = (rotation = 0, color) => {
//   const svg = `
//     <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
//       <g transform="rotate(${rotation} 20 20)">
//         <rect x="10" y="15" width="20" height="12" rx="2" fill="${color}"/>
//         <rect x="13" y="12" width="14" height="6" rx="1" fill="${color}"/>
//         <circle cx="14" cy="27" r="2" fill="#333"/>
//         <circle cx="26" cy="27" r="2" fill="#333"/>
//         <rect x="10" y="15" width="20" height="12" rx="2" fill="none" stroke="white" stroke-width="1.5"/>
//       </g>
//     </svg>
//   `;
  
//   return `data:image/svg+xml;base64,${btoa(svg)}`;
// };

// // Bus marker
// export const createBusMarker = (color) => {
//   const svg = `
//     <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
//       <ellipse cx="22" cy="40" rx="12" ry="2" fill="black" opacity="0.2"/>
//       <rect x="10" y="10" width="24" height="24" rx="3" fill="${color}"/>
//       <rect x="13" y="14" width="7" height="6" rx="1" fill="white" opacity="0.8"/>
//       <rect x="24" y="14" width="7" height="6" rx="1" fill="white" opacity="0.8"/>
//       <rect x="18" y="24" width="8" height="8" rx="1" fill="white" opacity="0.6"/>
//       <rect x="10" y="10" width="24" height="24" rx="3" fill="none" stroke="white" stroke-width="2"/>
//       <circle cx="15" cy="34" r="3" fill="#333"/>
//       <circle cx="29" cy="34" r="3" fill="#333"/>
//     </svg>
//   `;
  
//   return `data:image/svg+xml;base64,${btoa(svg)}`;
// };


// components/Map/CustomMarkers.jsx
'use client';

import { useTheme } from '@mui/material';

// Create custom marker icon - FIXED VERSION
export const createCustomMarker = (type) => {
  // Define colors directly instead of relying on theme
  const colors = {
    pickup: '#4CAF50', // Green
    dropoff: '#F44336', // Red
    driver: '#FFC107', // Primary yellow
    station: '#2196F3', // Blue
  };
  
  const color = colors[type] || '#FFC107';
  
  return {
    path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 3,
    scale: 10,
  };
};

// Animated pulse marker for live tracking
export const createPulseMarker = (color = '#FFC107') => {
  const canvas = document.createElement('canvas');
  canvas.width = 40;
  canvas.height = 40;
  const ctx = canvas.getContext('2d');
  
  // Draw outer pulse circle
  ctx.beginPath();
  ctx.arc(20, 20, 15, 0, 2 * Math.PI);
  ctx.fillStyle = `${color}33`;
  ctx.fill();
  
  // Draw inner solid circle
  ctx.beginPath();
  ctx.arc(20, 20, 8, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  
  // White border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  return canvas.toDataURL();
};

// Car marker with rotation
export const createCarMarker = (rotation = 0, color = '#FFC107') => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <g transform="rotate(${rotation}, 20, 20)">
        <rect x="8" y="15" width="24" height="10" rx="2" fill="${color}" />
        <circle cx="15" cy="28" r="4" fill="#333" />
        <circle cx="25" cy="28" r="4" fill="#333" />
        <rect x="10" y="12" width="20" height="4" rx="1" fill="${color}" />
      </g>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Bus marker
export const createBusMarker = (color = '#4CAF50') => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <rect x="6" y="10" width="28" height="16" rx="2" fill="${color}" />
      <rect x="12" y="12" width="16" height="4" fill="#FFFFFF" opacity="0.8" />
      <rect x="12" y="18" width="16" height="4" fill="#FFFFFF" opacity="0.8" />
      <circle cx="12" cy="28" r="4" fill="#333" />
      <circle cx="28" cy="28" r="4" fill="#333" />
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};