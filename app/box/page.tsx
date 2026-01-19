'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type TagResponse = {
  code: number;
  items: string[];
};

type UploadErrorDetail = {
  retry_at?: number;
  missing_fields?: string[];
};

type UploadErrorResponse = {
  detail?: UploadErrorDetail;
};

const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
const ALLOWED_IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'bmp',
  'tif',
  'tiff',
  'heif',
  'heic'
];
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/x-tiff',
  'image/heif',
  'image/heic'
]);
const ACCEPT_IMAGE_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS.map((ext) => `.${ext}`).join(',');
const IMAGE_FORMAT_HINT = ALLOWED_IMAGE_EXTENSIONS.map((ext) => `.${ext}`).join('/');

export default function BoxPage() {
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [message, setMessage] = useState('');
  const [includeImage, setIncludeImage] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [inputError, setInputError] = useState(false);
  const [tagError, setTagError] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const alertTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resultTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputErrorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tagErrorTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTags = async () => {
      try {
        const response = await fetch('https://api.harei.cn/tag/active', {
          cache: 'no-store'
        });
        if (!response.ok) {
          throw new Error('tag request failed');
        }
        const data = (await response.json()) as TagResponse;
        if (isMounted) {
          setTags(Array.isArray(data.items) ? data.items : []);
        }
      } catch (error) {
        if (isMounted) {
          setTags([]);
        }
      }
    };

    fetchTags();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (alertTimerRef.current) {
        clearTimeout(alertTimerRef.current);
      }
      if (resultTimerRef.current) {
        clearTimeout(resultTimerRef.current);
      }
      if (inputErrorTimerRef.current) {
        clearTimeout(inputErrorTimerRef.current);
      }
      if (tagErrorTimerRef.current) {
        clearTimeout(tagErrorTimerRef.current);
      }
    };
  }, []);

  const totalSize = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files]
  );

  useEffect(() => {
    const nextUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(nextUrls);

    return () => {
      nextUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const showAlert = (text: string) => {
    setAlertMessage(text);
    if (alertTimerRef.current) {
      clearTimeout(alertTimerRef.current);
    }
    alertTimerRef.current = setTimeout(() => {
      setAlertMessage(null);
    }, 3000);
  };

  const showResult = (text: string, shouldReload = false) => {
    setResultMessage(text);
    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
    }
    resultTimerRef.current = setTimeout(() => {
      setResultMessage(null);
      if (shouldReload) {
        window.location.reload();
      }
    }, 3000);
  };

  const triggerInputError = () => {
    setInputError(true);
    if (inputErrorTimerRef.current) {
      clearTimeout(inputErrorTimerRef.current);
    }
    inputErrorTimerRef.current = setTimeout(() => {
      setInputError(false);
    }, 3000);
  };

  const triggerTagError = () => {
    setTagError(true);
    if (tagErrorTimerRef.current) {
      clearTimeout(tagErrorTimerRef.current);
    }
    tagErrorTimerRef.current = setTimeout(() => {
      setTagError(false);
    }, 3000);
  };

  const handleFilesChange = (fileList: FileList | File[]) => {
    const nextFiles = Array.from(fileList);
    const { allowedFiles, rejectedCount } = nextFiles.reduce(
      (result, file) => {
        const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
        const isAllowed =
          ALLOWED_IMAGE_EXTENSIONS.includes(extension) || ALLOWED_IMAGE_MIME_TYPES.has(file.type);
        if (isAllowed) {
          result.allowedFiles.push(file);
        } else {
          result.rejectedCount += 1;
        }
        return result;
      },
      { allowedFiles: [] as File[], rejectedCount: 0 }
    );

    if (rejectedCount > 0) {
      showAlert(`仅支持上传${IMAGE_FORMAT_HINT}格式图片`);
    }

    if (allowedFiles.length > 0) {
      setFiles((currentFiles) => currentFiles.concat(allowedFiles));
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    if (event.dataTransfer.files.length > 0) {
      setIncludeImage(true);
      handleFilesChange(event.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((currentFiles) => currentFiles.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();
    let hasError = false;

    if (!trimmedMessage) {
      triggerInputError();
      hasError = true;
    }

    if (!selectedTag) {
      triggerTagError();
      hasError = true;
    }

    if (hasError) {
      showAlert('请填写文本并选择标签');
      return;
    }

    if (includeImage && totalSize > MAX_TOTAL_SIZE) {
      showAlert('图片总和超过50MB，请重新选择');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('message', trimmedMessage);
      formData.append('tag', selectedTag);
      if (includeImage && files.length > 0) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await fetch('https://api.harei.cn/box/uploads', {
        method: 'POST',
        body: formData
      });

      let responseData: UploadErrorResponse | null = null;
      try {
        responseData = (await response.json()) as UploadErrorResponse;
      } catch (error) {
        responseData = null;
      }

      if (response.status === 413) {
        showResult('文件过大，请重新上传');
        return;
      }

      if (response.status === 429 && responseData?.detail?.retry_at) {
        const retrySeconds = Math.max(
          0,
          Math.ceil((responseData.detail.retry_at * 1000 - Date.now()) / 1000)
        );
        showResult(`提交过快，还需等待${Math.ceil(retrySeconds)}秒`);
        return;
      }

      if (responseData?.detail?.missing_fields) {
        if (responseData.detail.missing_fields.includes('message')) {
          triggerInputError();
        }
        if (responseData.detail.missing_fields.includes('tag')) {
          triggerTagError();
        }
        showResult('请填写文本并选择标签');
        return;
      }

      if (!response.ok) {
        showResult('提交失败，请稍后再试');
        return;
      }

      showResult('提交成功', true);
    } catch (error) {
      showResult('提交失败，请稍后再试');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="box-page">
      <div className="box-card">
        <div className="box-grid">
          <div className="box-header">
            <img src="/images/icon/avatar.jpg" alt="avatar" className="box-avatar" />
            <div className="box-title">匿名提问箱</div>
          </div>
          <label className="box-tag">
            <select
              className={`box-select${tagError ? ' is-error' : ''}`}
              value={selectedTag}
              onChange={(event) => setSelectedTag(event.target.value)}
              aria-label="选择tag"
            >
              <option value="">#选择tag</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>
          <textarea
            className={`box-input${inputError ? ' is-error' : ''}`}
            placeholder="写下你的提问..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
          />
          <div className="box-hint-row">
            <span>{'隐藏内容编写格式：{{这是隐藏内容}}'}</span>
            <label className="box-checkbox">
              <input
                type="checkbox"
                checked={includeImage}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setIncludeImage(checked);
                  if (!checked) {
                    setFiles([]);
                  }
                }}
              />
              是否附图
            </label>
          </div>
          {includeImage && (
            <div
              className={`box-upload${isDragOver ? ' is-dragover' : ''}${
                previewUrls.length > 0 ? ' has-files' : ''
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="box-upload-title">
                拖拽/点击添加图片
              </div>
              {previewUrls.length > 0 && (
                <div className="box-upload-thumbs">
                  {previewUrls.map((url, index) => (
                    <div className="box-upload-thumb" key={url}>
                      <div className="box-upload-thumb-image">
                        <img src={url} alt={`已选择图片${index + 1}`} />
                      </div>
                      <button
                        type="button"
                        className="box-upload-remove"
                        aria-label="删除图片"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveFile(index);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPT_IMAGE_EXTENSIONS}
                className="box-upload-input"
                onChange={(event) => {
                  if (event.target.files) {
                    handleFilesChange(event.target.files);
                  }
                  event.target.value = '';
                }}
              />
            </div>
          )}
          <button className="box-submit" type="button" onClick={handleSubmit}>
            提交
          </button>
          <div className="box-alert-slot" aria-live="polite">
            {alertMessage && <div className="box-alert">{alertMessage}</div>}
          </div>
        </div>
        {isUploading && (
          <div className="box-loading" aria-live="polite">
            <div className="box-spinner" />
            <div className="box-loading-text">上传中...</div>
          </div>
        )}
        {resultMessage && (
          <div className="box-result" aria-live="polite">
            <div className="box-result-card">{resultMessage}</div>
          </div>
        )}
      </div>
    </div>
  );
}
