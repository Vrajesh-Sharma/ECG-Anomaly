import React, { useRef, useState, useCallback } from 'react';
import { Upload } from 'lucide-react';

/* ── Inline ECG SVG Icon ── */
const EcgIcon = () => (
  <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="20">
    <polyline
      points="0,16 10,16 14,8 17,24 20,4 23,28 26,16 36,16 40,10 44,22 48,16 64,16"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export default function UploadZone({ onFile, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleChange = (e) => { if (e.target.files[0]) onFile(e.target.files[0]); };

  return (
    <div
      className={`upload-zone ${dragging ? 'upload-zone--dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Upload ECG CSV file"
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      {/* Scanline animation on drag */}
      {dragging && <div className="scan-line" aria-hidden="true" />}

      {/* ECG Icon Circle */}
      <div className="upload-icon-circle">
        <EcgIcon />
      </div>

      <div className="upload-text-group">
        <p className="upload-main-text">
          Drop your ECG CSV here
        </p>
        <p className="upload-sub-text">
          or <span className="upload-browse-link">browse files</span>
        </p>
      </div>

      <div className="upload-format-hint">
        <Upload size={13} />
        <span>Supports .csv files only</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleChange}
        style={{ display: 'none' }}
        id="ecg-file-input"
        disabled={disabled}
      />
    </div>
  );
}
