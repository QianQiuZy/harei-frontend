'use client';

import { API_BASE_URL } from '@/lib/api-origin';
import { useState } from 'react';
import { useLegacyAdminToken } from '@/lib/auth/useLegacyAdminToken';
import { feedbackAnchor, useActionFeedback } from '@/components/member/ActionFeedback';

import type { CaptaingiftImageStatus } from './components';

type UploadResponse = {
  readonly code?: number;
  readonly detail?: string;
  readonly message?: string;
};

type CaptaingiftUploadState = {
  readonly imageStatus: CaptaingiftImageStatus;
  readonly onArchiveChange: () => void;
  readonly selectedMonth: string;
};

const getErrorMessage = (data: UploadResponse | null) => {
  if (!data) {
    return '上传失败，请稍后再试';
  }
  if (typeof data.detail === 'string' && data.detail.trim()) {
    return data.detail;
  }
  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }
  return '上传失败，请稍后再试';
};

export function useCaptaingiftUpload({
  imageStatus,
  onArchiveChange,
  selectedMonth
}: CaptaingiftUploadState) {
  const token = useLegacyAdminToken();
  const setFeedback = useActionFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileSelection = (selectedFile: File, trigger: HTMLElement) => {
    if (!selectedFile.type.startsWith('image/')) {
      setFeedback({ text: '请上传图片文件', error: true, anchor: feedbackAnchor(trigger) });
      return;
    }
    setFile(selectedFile);
    setFeedback(null);
  };

  const handleSubmit = async (trigger: HTMLButtonElement) => {
    const anchor = feedbackAnchor(trigger);
    if (!file) {
      setFeedback({ text: '请上传图片', error: true, anchor });
      return;
    }

    if (!token) {
      window.location.replace('/login');
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append('month', selectedMonth);
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/captaingift/add`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      let responseData: UploadResponse | null = null;
      try {
        responseData = (await response.json()) as UploadResponse;
      } catch {
        responseData = null;
      }

      if (!response.ok || responseData?.code !== 0) {
        setFeedback({ text: getErrorMessage(responseData), error: true, anchor });
        return;
      }

      setFile(null);
      setFeedback({ text: '上传成功', anchor });
      onArchiveChange();
    } catch {
      setFeedback({ text: '上传失败，请稍后再试', error: true, anchor });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (trigger: HTMLButtonElement) => {
    const anchor = feedbackAnchor(trigger);
    if (!token || imageStatus !== 'available') {
      return;
    }

    if (!window.confirm(`确定删除 ${selectedMonth} 的舰礼留档吗？`)) {
      return;
    }

    setIsDeleting(true);
    setFeedback(null);

    try {
      const response = await fetch(`${API_BASE_URL}/captaingift/delete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ month: selectedMonth })
      });

      let responseData: UploadResponse | null = null;
      try {
        responseData = (await response.json()) as UploadResponse;
      } catch {
        responseData = null;
      }

      if (!response.ok || responseData?.code !== 0) {
        setFeedback({ text: '删除失败，请稍后重试', error: true, anchor });
        return;
      }

      setFile(null);
      onArchiveChange();
      setFeedback({ text: '删除成功', anchor });
    } catch {
      setFeedback({ text: '删除失败，请稍后重试', error: true, anchor });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    file,
    handleDelete,
    handleFileSelection,
    handleSubmit,
    isDeleting,
    isSubmitting,
    reset: () => {
      setFile(null);
      setFeedback(null);
    },
    setFile
  };
}
