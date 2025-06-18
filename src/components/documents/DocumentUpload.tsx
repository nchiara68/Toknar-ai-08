// src/components/documents/DocumentUpload.tsx
import React from 'react';
import { StorageManager } from '@aws-amplify/ui-react-storage';
import { ProcessingStats, UploadEvent } from '../../types';

interface DocumentUploadProps {
  processingStats: ProcessingStats;
  onUploadSuccess: (event: UploadEvent) => Promise<void>;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  processingStats,
  onUploadSuccess
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28A745';
      case 'processing': return '#FFC107';
      case 'failed': return '#DC3545';
      default: return '#6C757D';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '⚙️';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  return (
    <>
      {/* Upload Header */}
      <div style={{
        padding: '0.75rem 1rem',
        backgroundColor: '#F8F9FA',
        borderBottom: '1px solid #DEE2E6'
      }}>
        <strong style={{ color: '#232F3E' }}>📁 Document Upload</strong>
        <span style={{ marginLeft: '1rem', color: '#6C757D', fontSize: '0.9rem' }}>
          Upload files to trigger automatic processing
        </span>
      </div>

      <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
        {/* Upload Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>📤 Upload New Documents</h3>
          <StorageManager
            acceptedFileTypes={['.pdf', '.txt', '.doc', '.docx']}
            path="documents/"
            maxFileCount={10}
            maxFileSize={10 * 1024 * 1024}
            onUploadSuccess={onUploadSuccess}
            onUploadError={(error) => {
              console.error('Upload error:', error);
              console.error('Upload failed. Please try again.');
            }}
          />
        </div>

        {/* Processing Pipeline Status */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>📊 Processing Pipeline Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            {[
              { status: 'pending', label: 'Pending', count: processingStats.pending },
              { status: 'processing', label: 'Processing', count: processingStats.processing },
              { status: 'completed', label: 'Completed', count: processingStats.completed },
              { status: 'failed', label: 'Failed', count: processingStats.failed }
            ].map(({ status, label, count }) => (
              <div key={status} style={{
                padding: '1rem',
                backgroundColor: '#F8F9FA',
                borderRadius: '8px',
                textAlign: 'center',
                border: `2px solid ${getStatusColor(status)}`
              }}>
                <div style={{ fontSize: '1.5rem' }}>{getStatusIcon(status)}</div>
                <div style={{ fontWeight: 'bold', color: getStatusColor(status) }}>
                  {label}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};