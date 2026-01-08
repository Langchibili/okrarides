'use client';

import { useState } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import { Box, Typography, Paper } from '@mui/material';
import { API_BASE_URL } from '@/Constants';
import { apiClient } from '@/lib/api/client';

registerPlugin(
  FilePondPluginImagePreview,
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize
);

export const DocumentUpload = ({
  documentType,
  label,
  onUploadComplete,
  allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
  maxFileSize = '10MB',
}) => {
  const [files, setFiles] = useState([]);

  const handleProcess = (
    fieldName,
    file,
    metadata,
    load,
    error,
    progress,
    abort
  ) => {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('documentType', documentType);

    const request = new XMLHttpRequest();
    request.open('POST', `${API_BASE_URL}/driver/documents/upload`);

    const jwt = apiClient.getToken();
    if (jwt) request.setRequestHeader('Authorization', `Bearer ${jwt}`);

    request.upload.onprogress = (e) => {
      progress(e.lengthComputable, e.loaded, e.total);
    };

    request.onload = async function () {
      if (request.status >= 200 && request.status < 300) {
        try {
          const responseData = JSON.parse(request.responseText);
          if (onUploadComplete) {
            onUploadComplete(responseData);
          }
          load(request.responseText);
        } catch (err) {
          error('Upload failed');
        }
      } else {
        error('Upload failed');
      }
    };

    request.onerror = () => error('Upload error');
    request.onabort = () => abort();

    request.send(formData);

    return {
      abort: () => {
        request.abort();
        abort();
      },
    };
  };

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        {label}
      </Typography>
      <FilePond
        files={files}
        onupdatefiles={setFiles}
        allowMultiple={false}
        maxFileSize={maxFileSize}
        acceptedFileTypes={allowedTypes}
        server={{
          process: handleProcess,
        }}
        labelIdle='Drag & Drop your file or <span class="filepond--label-action">Browse</span>'
      />
    </Paper>
  );
};

export default DocumentUpload;
