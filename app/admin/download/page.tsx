'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type DownloadAddResponse = {
  code?: number;
  download_id?: number;
  path?: string;
  detail?: string;
  message?: string;
};

const API_HOST = 'https://api.harei.cn';
const TOKEN_KEY = 'harei-admin-token';
const TOKEN_EXPIRES_KEY = 'harei-admin-token-expires';
const ARCHIVE_EXTENSIONS = ['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.bz2', '.xz'];

const isArchiveFile = (file: File) => {
  const lowerName = file.name.toLowerCase();
  return ARCHIVE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
};

const getErrorMessage = (data: DownloadAddResponse | null) => {
  if (!data) {
    return '提交失败，请稍后再试';
  }
  if (typeof data.detail === 'string' && data.detail.trim()) {
    return data.detail;
  }
  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }
  return '提交失败，请稍后再试';
};

export default function AdminDownloadPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const expiresAt = Number(localStorage.getItem(TOKEN_EXPIRES_KEY));

    if (!storedToken || !expiresAt || Number.isNaN(expiresAt) || Date.now() > expiresAt) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRES_KEY);
      router.replace('/login');
      return;
    }

    setToken(storedToken);
  }, [router]);

  const handleFileSelection = (selectedFile: File) => {
    if (!isArchiveFile(selectedFile)) {
      setStatusMessage('请上传压缩包文件');
      return;
    }
    setFile(selectedFile);
    setLink('');
    setStatusMessage('');
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedLink = link.trim();

    if (!trimmedName) {
      setStatusMessage('请输入资源名称');
      return;
    }

    if (!file && !trimmedLink) {
      setStatusMessage('请上传文件或填入链接');
      return;
    }

    if (trimmedLink && !trimmedLink.startsWith('https://')) {
      setStatusMessage('链接需以https://开头');
      return;
    }

    if (!token) {
      router.replace('/login');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('');

    try {
      let response: Response;

      if (trimmedLink) {
        response = await fetch(`${API_HOST}/download/add`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ description: trimmedName, path: trimmedLink })
        });
      } else if (file) {
        const formData = new FormData();
        formData.append('description', trimmedName);
        formData.append('file', file);

        response = await fetch(`${API_HOST}/download/add`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
      } else {
        setStatusMessage('请上传文件或填入链接');
        return;
      }

      let responseData: DownloadAddResponse | null = null;
      try {
        responseData = (await response.json()) as DownloadAddResponse;
      } catch (error) {
        responseData = null;
      }

      if (!response.ok || responseData?.code !== 0) {
        setStatusMessage(getErrorMessage(responseData));
        return;
      }

      setStatusMessage('提交成功');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setStatusMessage('提交失败，请稍后再试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showLinkInput = !file;
  const showUploadArea = !link.trim();

  return (
    <section className="admin-page admin-download-page">
      <div className="admin-download-card">
        <header className="admin-download-header">
          <h1 className="admin-download-title">上传下载资源</h1>
          {statusMessage ? <span className="admin-download-status">{statusMessage}</span> : null}
        </header>
        <div className="admin-download-form">
          <label className="admin-download-field">
            <span className="admin-download-label">资源名称</span>
            <input
              type="text"
              className="admin-download-input"
              placeholder="请输入资源名称"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          {showLinkInput && (
            <label className="admin-download-field">
              <span className="admin-download-label">资源链接</span>
              <input
                type="url"
                className="admin-download-input"
                placeholder="https://..."
                value={link}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setLink(nextValue);
                  if (nextValue.trim()) {
                    setFile(null);
                  }
                }}
              />
            </label>
          )}
          {showUploadArea && (
            <div
              className={`box-upload admin-download-upload${isDragOver ? ' is-dragover' : ''}${
                file ? ' has-files' : ''
              }`}
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
                  handleFileSelection(droppedFile);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="box-upload-title">拖拽/点击上传压缩包(仅限1个文件)</div>
              {file ? (
                <div className="admin-download-file-row">
                  <span className="admin-download-file-name">{file.name}</span>
                  <button
                    type="button"
                    className="admin-download-file-remove"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFile(null);
                    }}
                  >
                    移除
                  </button>
                </div>
              ) : (
                <div className="admin-download-file-hint">仅支持.zip/.rar/.7z等压缩包文件</div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="box-upload-input"
                accept={ARCHIVE_EXTENSIONS.join(',')}
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0];
                  if (selectedFile) {
                    handleFileSelection(selectedFile);
                  }
                  event.target.value = '';
                }}
              />
            </div>
          )}
          <button
            type="button"
            className="admin-download-submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            提交
          </button>
        </div>
      </div>
    </section>
  );
}
