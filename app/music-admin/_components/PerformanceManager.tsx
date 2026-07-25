"use client";

import { ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { Performance } from "@/lib/music/schemas";
import {
	createPerformance,
	deletePerformance,
	isMusicVersionConflict,
	updatePerformance,
} from "@/lib/music-admin/client";
import type { PerformanceDraft } from "@/lib/music-admin/schemas";
import styles from "../form.module.css";

const EMPTY_DRAFT: PerformanceDraft = {
	date: "",
	platform: "哔哩哔哩",
	stream_title: null,
	stream_url: null,
	clip_url: null,
};

export const PerformanceManager = ({
	token,
	songId,
	songVersion,
	performances,
	onChanged,
}: {
	readonly token: string;
	readonly songId: number;
	readonly songVersion: number;
	readonly performances: readonly Performance[];
	readonly onChanged: () => Promise<void>;
}) => {
	const [draft, setDraft] = useState<PerformanceDraft>(EMPTY_DRAFT);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [conflict, setConflict] = useState(false);

	const edit = (performance: Performance) => {
		setEditingId(performance.performance_id ?? null);
		setDraft({
			date: performance.date,
			platform: performance.stream.platform,
			stream_title: performance.stream.title ?? null,
			stream_url: performance.stream.url ?? null,
			clip_url: performance.clipUrl ?? null,
		});
	};

	const save = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setBusy(true);
		setMessage(null);
		setConflict(false);
		try {
			if (editingId)
				await updatePerformance(token, editingId, songVersion, draft);
			else await createPerformance(token, songId, songVersion, draft);
			setDraft(EMPTY_DRAFT);
			setEditingId(null);
			setMessage("演唱记录已保存");
			await onChanged();
		} catch (reason) {
			if (isMusicVersionConflict(reason)) {
				await onChanged();
				setConflict(true);
				setMessage("歌曲版本已变化，现已刷新演唱记录，请重新提交。");
			} else {
				setMessage(reason instanceof Error ? reason.message : "保存失败");
			}
		} finally {
			setBusy(false);
		}
	};

	const remove = async (performanceId: number) => {
		if (!window.confirm("确定删除这条演唱记录？")) return;
		setBusy(true);
		setMessage(null);
		setConflict(false);
		try {
			await deletePerformance(token, performanceId, songVersion);
			await onChanged();
		} catch (reason) {
			if (isMusicVersionConflict(reason)) {
				await onChanged();
				setConflict(true);
				setMessage("歌曲版本已变化，现已刷新演唱记录，请重试删除。");
			} else {
				setMessage(reason instanceof Error ? reason.message : "删除失败");
			}
		} finally {
			setBusy(false);
		}
	};

	const set = (field: keyof PerformanceDraft, value: string) =>
		setDraft((current) => ({ ...current, [field]: value || null }));

	return (
		<section className={styles.performancePanel}>
			<header>
				<div>
					<p>PERFORMANCES</p>
					<h2>演唱记录</h2>
				</div>
				<span>{performances.length} 条</span>
			</header>
			<form className={styles.performanceForm} onSubmit={save}>
				<label>
					<span>日期</span>
					<input
						type="date"
						value={draft.date}
						onChange={(event) => set("date", event.target.value)}
						required
					/>
				</label>
				<label>
					<span>平台</span>
					<input
						value={draft.platform}
						onChange={(event) => set("platform", event.target.value)}
						required
					/>
				</label>
				<label className={styles.wide}>
					<span>直播标题</span>
					<input
						value={draft.stream_title ?? ""}
						onChange={(event) => set("stream_title", event.target.value)}
					/>
				</label>
				<label className={styles.wide}>
					<span>直播链接</span>
					<input
						type="url"
						value={draft.stream_url ?? ""}
						onChange={(event) => set("stream_url", event.target.value)}
						placeholder="用于自动识别直播间 ID"
					/>
				</label>
				<label className={styles.wide}>
					<span>歌切链接</span>
					<input
						type="url"
						value={draft.clip_url ?? ""}
						onChange={(event) => set("clip_url", event.target.value)}
						placeholder="用于自动识别 BV 号"
					/>
				</label>
				<div className={styles.formActions}>
					<button className={styles.primary} type="submit" disabled={busy}>
						{editingId ? <Pencil size={16} /> : <Plus size={16} />}
						{editingId ? "保存修改" : "添加记录"}
					</button>
					{editingId ? (
						<button
							type="button"
							onClick={() => {
								setEditingId(null);
								setDraft(EMPTY_DRAFT);
							}}
						>
							<X size={16} />
							取消
						</button>
					) : null}
				</div>
			</form>
			{message ? (
				<p
					className={`${styles.message} ${conflict ? styles.warning : ""}`}
					aria-live="polite"
				>
					{message}
				</p>
			) : null}
			<ol className={styles.performanceList}>
				{performances.map((performance) => (
					<li key={performance.id}>
						<time>{performance.date}</time>
						<div>
							<strong>
								{performance.stream.platform} ·{" "}
								{performance.stream.id ?? "同日直播"}
							</strong>
							<span>{performance.stream.title ?? performance.id}</span>
						</div>
						{performance.clipUrl ? (
							<a
								href={performance.clipUrl}
								target="_blank"
								rel="noreferrer noopener"
								aria-label="打开歌切"
							>
								<ExternalLink size={16} />
							</a>
						) : null}
						<button
							type="button"
							aria-label="编辑记录"
							onClick={() => edit(performance)}
						>
							<Pencil size={16} />
						</button>
						{performance.performance_id ? (
							<button
								className={styles.dangerIcon}
								type="button"
								aria-label="删除记录"
								onClick={() => void remove(performance.performance_id ?? 0)}
							>
								<Trash2 size={16} />
							</button>
						) : null}
					</li>
				))}
			</ol>
		</section>
	);
};
