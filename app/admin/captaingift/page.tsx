'use client';

import Image from 'next/image';

import {
  CaptaingiftHeader,
  CaptaingiftUpload
} from './components';
import { useCaptaingiftArchive } from './use-captaingift-archive';
import { useCaptaingiftUpload } from './use-captaingift-upload';

export default function AdminCaptaingiftPage() {
  const archive = useCaptaingiftArchive();
  const upload = useCaptaingiftUpload({
    imageStatus: archive.imageStatus,
    onDeleteSuccess: () => archive.setImageStatus('missing'),
    selectedMonth: archive.selectedMonth
  });

  const handleMonthChange = (month: string) => {
    archive.setSelectedMonth(month);
    upload.reset();
  };

  const showUpload = archive.imageStatus === 'missing' || archive.imageStatus === 'error';

  return (
    <section className="admin-page admin-captaingift-page">
      <div className="admin-captaingift-card">
        <CaptaingiftHeader
          selectedMonth={archive.selectedMonth}
          monthOptions={archive.monthOptions}
          imageStatus={archive.imageStatus}
          statusMessage={upload.statusMessage}
          isDeleting={upload.isDeleting}
          isSubmitting={upload.isSubmitting}
          onMonthChange={handleMonthChange}
          onDelete={upload.handleDelete}
        />

        <div className="admin-captaingift-body">
          {archive.isArchiveLoading || archive.imageStatus === 'loading' ? (
            <div className="captaingift-status">正在加载...</div>
          ) : archive.archiveError ? (
            <div className="captaingift-status is-error">{archive.archiveError}</div>
          ) : archive.imageStatus === 'available' ? (
            <div className="captaingift-image-wrap">
              <Image
                src={archive.imageUrl}
                alt={`${archive.selectedMonth} 舰礼留档`}
                className="captaingift-image"
                width={1200}
                height={800}
                sizes="(max-width: 640px) 90vw, 40vw"
                unoptimized
              />
            </div>
          ) : showUpload ? (
            <>
              {archive.imageStatus === 'error' ? (
                <div className="captaingift-status is-error">图片加载失败</div>
              ) : null}
              <CaptaingiftUpload
                file={upload.file}
                isSubmitting={upload.isSubmitting}
                onFileSelection={upload.handleFileSelection}
                onFileRemove={upload.reset}
                onSubmit={upload.handleSubmit}
              />
            </>
          ) : (
            <div className="captaingift-status">暂无内容</div>
          )}
        </div>
      </div>
    </section>
  );
}
