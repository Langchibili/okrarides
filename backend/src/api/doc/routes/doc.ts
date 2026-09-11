//============================================
// src/api/document/routes/document.ts
//============================================
export default {
  routes: [
    {
      method: 'POST',
      path: '/driver/documents/upload',
      handler: 'doc.uploadDocument',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/driver/verification/status',
      handler: 'doc.getVerificationStatus',
      config: { policies: [] }
    },
  ]
};