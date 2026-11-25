import { s } from '@/components/member/MemberUI';

export type PageInfo = { page: number; page_size: number; total: number };

export function Pagination({
  data,
  label,
  onChange
}: {
  data: PageInfo;
  label: string;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(data.total / data.page_size));
  return (
    <nav className={s.pagination} aria-label={label}>
      <span>共 {data.total} 条</span>
      <button
        type="button"
        className={s.secondary}
        disabled={data.page <= 1}
        onClick={() => onChange(data.page - 1)}
      >
        上一页
      </button>
      <span aria-live="polite">
        第 {data.page} / {pages} 页
      </span>
      <button
        type="button"
        className={s.secondary}
        disabled={data.page >= pages}
        onClick={() => onChange(data.page + 1)}
      >
        下一页
      </button>
    </nav>
  );
}
