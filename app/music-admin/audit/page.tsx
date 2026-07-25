"use client";

import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { useEffect, useState } from "react";
import { useMusicAdminSession } from "@/app/music-admin/_components/SessionContext";
import { getMusicAudit } from "@/lib/music-admin/client";
import type { AuditResponse } from "@/lib/music-admin/schemas";
import styles from "../admin.module.css";

export default function MusicAuditPage() {
	const { session } = useMusicAdminSession();
	const [page, setPage] = useState(1);
	const [data, setData] = useState<AuditResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		void getMusicAudit(session.token, page)
			.then(setData)
			.catch(() => setError("操作记录加载失败，请稍后重试。"));
	}, [page, session.token]);

	return (
		<section>
			<header className={styles.pageHeading}>
				<div>
					<p>AUDIT TRAIL</p>
					<h1>操作记录</h1>
				</div>
			</header>
			{error ? <p className={styles.error}>{error}</p> : null}
			<div className={styles.auditList}>
				{data?.items.map((event) => (
					<article key={event.audit_id}>
						<History size={18} />
						<div>
							<strong>{event.action}</strong>
							<span>
								{event.entity_type} · {event.entity_id}
							</span>
						</div>
						<div>
							<strong>{event.actor}</strong>
							<time>
								{new Date(event.created_at).toLocaleString("zh-CN", {
									timeZone: "UTC",
								})}{" "}
								UTC
							</time>
						</div>
						<details className={styles.auditDetails}>
							<summary>查看详情</summary>
							<pre>{JSON.stringify(event.details, null, 2)}</pre>
						</details>
					</article>
				))}
				{!data?.items.length ? (
					<p className={styles.empty}>暂无操作记录</p>
				) : null}
			</div>
			<footer className={styles.pagination}>
				<span>共 {data?.total ?? 0} 条</span>
				<div>
					<button
						type="button"
						disabled={page <= 1}
						onClick={() => setPage((value) => value - 1)}
					>
						<ChevronLeft size={17} />
						上一页
					</button>
					<span>第 {page} 页</span>
					<button
						type="button"
						disabled={!data || page * data.page_size >= data.total}
						onClick={() => setPage((value) => value + 1)}
					>
						下一页
						<ChevronRight size={17} />
					</button>
				</div>
			</footer>
		</section>
	);
}
