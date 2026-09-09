'use client';

import { useRef, useState } from 'react';

export type CaptaingiftImageStatus = 'idle' | 'loading' | 'available' | 'missing' | 'error';

type CaptaingiftHeaderProps = {
  readonly selectedMonth: string;
  readonly monthOptions: readonly string[];
  readonly imageStatus: CaptaingiftImageStatus;
  readonly statusMessage: string;
  readonly isDeleting: boolean;
  readonly isSubmitting: boolean;
  readonly onMonthChange: (month: string) => void;
  readonly onDelete: () => void;
};

export function CaptaingiftHeader({
  selectedMonth,
  monthOptions,
  imageStatus,
  statusMessage,
  isDeleting,
  isSubmitting,
  onMonthChange,
  onDelete
}: CaptaingiftHeaderProps) {
  return (
    <header className="admin-captaingift-header">
      <div className="admin-captaingift-month-row">
        <div className="admin-captaingift-select-wrap">
          <select
            className="admin-captaingift-select"
            value={selectedMonth}
            onChange={(event) => onMonthChange(event.target.value)}
          >
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>
        {imageStatus === 'available' ? (
          <button
            type="button"
            className="admin-captaingift-delete"
            onClick={onDelete}
            disabled={isDeleting || isSubmitting}
            aria-label={`删除 ${selectedMonth} 舰礼留档`}
          >
            {isDeleting ? '删除中...' : '删除'}
          </button>
        ) : null}
      </div>
      {statusMessage ? (
        <span className="admin-captaingift-status" role="status" aria-live="polite">
          {statusMessage}
        </span>
      ) : null}
    </header>
  );
}

type CaptaingiftUploadProps = {
  readonly file: File | null;
  readonly isSubmitting: boolean;
  readonly onFileSelection: (file: File) => void;
  readonly onFileRemove: () => void;
  readonly onSubmit: () => void;
};

export function CaptaingiftUpload({
  file,
  isSubmitting,
  onFileSelection,
  onFileRemove,
  onSubmit
}: CaptaingiftUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div className="admin-captaingift-upload">
      <div
        className={`box-upload${isDragOver ? ' is-dragover' : ''}${file ? ' has-files' : ''}`}
      >
        <button
          type="button"
          className="admin-captaingift-upload-trigger"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragOver(false);
            const droppedFile = event.dataTransfer.files[0];
            if (droppedFile) {
              onFileSelection(droppedFile);
            }
          }}
        >
          <span className="box-upload-title">拖拽/点击上传图片(仅限1张)</span>
          {!file ? <span className="admin-captaingift-file-hint">支持常见图片格式</span> : null}
        </button>
        {file ? (
          <div className="admin-captaingift-file-row">
            <span className="admin-captaingift-file-name">{file.name}</span>
            <button type="button" className="admin-captaingift-file-remove" onClick={onFileRemove}>
              移除
            </button>
          </div>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          className="box-upload-input"
          accept="image/*"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0];
            if (selectedFile) {
              onFileSelection(selectedFile);
            }
            event.target.value = '';
          }}
        />
      </div>
      <button
        type="button"
        className="admin-captaingift-submit"
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        提交
      </button>
    </div>
  );
}
