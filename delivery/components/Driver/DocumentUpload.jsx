'use client';

import { useState } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import { Box, Typography } from '@mui/material';
import {
  UploadFile as UploadIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { API_BASE_URL } from '@/Constants';
import { apiClient } from '@/lib/api/client';

registerPlugin(
  FilePondPluginImagePreview,
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize
);

// ── FilePond style overrides ─────────────────────────────────────────────────
// Injected once via a <style> tag so we don't need a separate CSS file.
const FILEPOND_STYLES = `
  .filepond--root {
    font-family: inherit;
    margin-bottom: 0;
  }
  .filepond--drop-label {
    color: #9e9e9e;
    font-size: 0.875rem;
    font-weight: 500;
  }
  .filepond--drop-label label {
    cursor: pointer;
  }
  .filepond--label-action {
    color: #FF8C00;
    font-weight: 700;
    text-decoration: none;
    border-bottom: 1.5px solid rgba(255,140,0,0.35);
    transition: color 0.15s ease, border-color 0.15s ease;
  }
  .filepond--label-action:hover {
    color: #FFC107;
    border-color: #FFC107;
  }
  .filepond--panel-root {
    background: transparent !important;
    border-radius: 12px !important;
    border: 2px dashed rgba(255,140,0,0.3) !important;
    transition: border-color 0.2s ease;
  }
  .filepond--root:hover .filepond--panel-root,
  .filepond--root.filepond--hopper-droptarget .filepond--panel-root {
    border-color: #FF8C00 !important;
  }
  .filepond--item-panel {
    background: linear-gradient(135deg, rgba(255,140,0,0.12) 0%, rgba(255,193,7,0.08) 100%) !important;
    border-radius: 10px !important;
  }
  .filepond--file-action-button {
    background: linear-gradient(135deg, #FF8C00 0%, #FFC107 100%);
    cursor: pointer;
  }
  .filepond--file-action-button:hover {
    box-shadow: 0 2px 10px rgba(255,140,0,0.45);
  }
  .filepond--file {
    color: inherit;
  }
  .filepond--file-status-main,
  .filepond--file-status-sub {
    color: inherit;
    opacity: 0.8;
  }
  .filepond--progress-indicator {
    color: #FF8C00;
  }
  .filepond--image-preview-overlay-idle {
    color: rgba(255,140,0,0.15);
  }
`;

// Derive a type icon from the accepted types list
const TypeIcon = ({ types }) => {
  if (types.some((t) => t.includes('pdf'))) return <PdfIcon sx={{ fontSize: 18, color: 'text.disabled' }} />;
  if (types.some((t) => t.includes('image'))) return <ImageIcon sx={{ fontSize: 18, color: 'text.disabled' }} />;
  return <UploadIcon sx={{ fontSize: 18, color: 'text.disabled' }} />;
};

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
    <>
      {/* Inject FilePond overrides once */}
      <style>{FILEPOND_STYLES}</style>

      <Box
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          mb: 2,
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(255,140,0,0.1)',
          },
        }}
      >
        {/* Header band */}
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            background: 'linear-gradient(135deg, rgba(255,140,0,0.1) 0%, rgba(255,193,7,0.06) 100%)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255,140,0,0.18) 0%, rgba(255,193,7,0.12) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <TypeIcon types={allowedTypes} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.2 }}
            >
              {label}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.disabled', fontSize: '0.68rem' }}
            >
              {allowedTypes
                .map((t) => t.split('/')[1]?.toUpperCase())
                .filter(Boolean)
                .join(' · ')}{' '}
              &nbsp;·&nbsp; Max {maxFileSize}
            </Typography>
          </Box>
        </Box>

        {/* FilePond drop area */}
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'background.paper' }}>
          <FilePond
            files={files}
            onupdatefiles={setFiles}
            allowMultiple={false}
            maxFileSize={maxFileSize}
            acceptedFileTypes={allowedTypes}
            server={{ process: handleProcess }}
            labelIdle='Drag & drop or <span class="filepond--label-action">browse</span>'
          />
        </Box>
      </Box>
    </>
  );
};

export default DocumentUpload;