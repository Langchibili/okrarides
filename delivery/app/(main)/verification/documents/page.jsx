'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  IconButton,
} from '@mui/material';
import { ArrowBack as BackIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { DocumentUpload } from '@/components/Driver/DocumentUpload';
import { useDriver } from '@/lib/hooks/useDriver';
import { getVerificationStatus } from '@/Functions';
import { DOCUMENT_TYPE } from '@/Constants';

export default function DocumentsUploadPage() {
  const router = useRouter();
  const { driverProfile, adminSettings, refreshDriverProfile } = useDriver();
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUploadedDocuments();
  }, []);

  const loadUploadedDocuments = async () => {
    try {
      const response = await getVerificationStatus();
      if (response.success && response.verification.documents) {
        setUploadedDocs(response.verification.documents);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = async (documentType, response) => {
    console.log('Document uploaded:', documentType, response);
    setUploadedDocs((prev) => ({
      ...prev,
      [documentType]: true,
    }));
    await refreshDriverProfile();
  };

  const handleSubmitForReview = async () => {
    // Check if all required documents are uploaded
    const requiredDocs = [
      adminSettings?.requireDriverLicense !== false && DOCUMENT_TYPE.DRIVERS_LICENSE,
      adminSettings?.requireNationalId !== false && DOCUMENT_TYPE.NATIONAL_ID,
      adminSettings?.requireProofOfAddress !== false && DOCUMENT_TYPE.PROOF_OF_ADDRESS,
    ].filter(Boolean);

    const allUploaded = requiredDocs.every((doc) => uploadedDocs[doc]);

    if (!allUploaded) {
      alert('Please upload all required documents before submitting');
      return;
    }

    if (window.confirm('Submit documents for verification?')) {
      try {
        // API call to submit for review
        router.push('/verification');
      } catch (error) {
        console.error('Error submitting for review:', error);
      }
    }
  };

  const documents = [
    {
      type: DOCUMENT_TYPE.DRIVERS_LICENSE,
      label: "Driver's License",
      description: 'Upload clear photos of front and back',
      required: adminSettings?.requireDriverLicense !== false,
    },
    {
      type: DOCUMENT_TYPE.NATIONAL_ID,
      label: 'National Registration Card (NRC)',
      description: 'Upload clear photos of front and back',
      required: adminSettings?.requireNationalId !== false,
    },
    {
      type: DOCUMENT_TYPE.PROOF_OF_ADDRESS,
      label: 'Proof of Address',
      description: 'Utility bill, bank statement, or lease agreement (not older than 3 months)',
      required: adminSettings?.requireProofOfAddress !== false,
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <IconButton onClick={() => router.back()}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Upload Documents
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Upload clear, readable photos
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            All documents must be valid and clearly visible. Accepted formats: JPG,
            PNG, PDF (max 10MB)
          </Typography>
        </Alert>

        {/* Document Uploads */}
        {documents
          .filter((doc) => doc.required)
          .map((doc) => (
            <Box key={doc.type} sx={{ mb: 3 }}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {doc.label}
                      {uploadedDocs[doc.type] && (
                        <CheckIcon
                          color="success"
                          sx={{ ml: 1, verticalAlign: 'middle' }}
                        />
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {doc.description}
                    </Typography>
                  </Box>
                </Box>

                <DocumentUpload
                  documentType={doc.type}
                  label=""
                  onUploadComplete={(response) =>
                    handleUploadComplete(doc.type, response)
                  }
                  allowedTypes={['image/jpeg', 'image/png', 'application/pdf']}
                  maxFileSize="10MB"
                />
              </Paper>
            </Box>
          ))}

        {/* Submit Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSubmitForReview}
          disabled={
            !documents
              .filter((doc) => doc.required)
              .every((doc) => uploadedDocs[doc.type])
          }
          sx={{ mt: 2, height: 56, borderRadius: 3, fontWeight: 600 }}
        >
          {documents
            .filter((doc) => doc.required)
            .every((doc) => uploadedDocs[doc.type])
            ? 'Continue to Vehicle Information'
            : 'Upload All Required Documents'}
        </Button>
      </Box>
    </Box>
  );
}
