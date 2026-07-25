"use client";

import { Archive, RotateCcw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PerformanceManager } from "@/app/music-admin/_components/PerformanceManager";
import { useMusicAdminSession } from "@/app/music-admin/_components/SessionContext";
import { SongEditorHeader } from "@/app/music-admin/_components/SongEditorHeader";
import {
	createSong,
	getManagedSong,
	isMusicVersionConflict,
	setSongArchived,
	updateSong,
} from "@/lib/music-admin/client";
import type { ManagedSongDetail, SongDraft } from "@/lib/music-admin/schemas";
import styles from "../form.module.css";

const EMPTY_SONG: SongDraft = {
	title: "",
	artist: "",
	artists: [],
	genre: "",
	language: "",
	work_type: "翻唱",
	notes: "",
	metadata_status: "complete",
};

export const SongEditor = ({ songId }: { readonly songId: number | null }) => {
	const router = useRouter();
	const { session } = useMusicAdminSession();
	const [detail, setDetail] = useState<ManagedSongDetail["item"] | null>(null);
	const [draft, setDraft] = useState<SongDraft>(EMPTY_SONG);
	const [artistsText, setArtistsText] = useState("");
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [conflict, setConflict] = useState(false);

	const load = useCallback(async () => {
		if (!songId) return;
		const response = await getManagedSong(session.token, songId);
		const song = response.item;
		setDetail(song);
		setDraft({
			title: song.title,
			artist: song.artist,
			artists: song.artists,
			genre: song.genre,
			language: song.language,
			work_type: song.workType,
			notes: song.notes,
			metadata_status: song.metadataStatus,
		});
		setArtistsText(song.artists.join(" / "));
	}, [session.token, songId]);

	useEffect(() => {
		void load().catch((reason: unknown) =>
			setMessage(reason instanceof Error ? reason.message : "歌曲加载失败"),
		);
	}, [load]);

	const set = (field: keyof SongDraft, value: string) =>
		setDraft((current) => ({ ...current, [field]: value }));

	const save = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setBusy(true);
		setMessage(null);
		setConflict(false);
		const normalized = {
			...draft,
			artists: artistsText
				.split(/[/，,]/)
				.map((item) => item.trim())
				.filter(Boolean),
		};
		try {
			if (songId && detail) {
				await updateSong(session.token, songId, detail.version, normalized);
				await load();
				setMessage("歌曲已保存");
			} else {
				const createdId = await createSong(session.token, normalized);
				router.replace(`/music-admin/songs/${createdId}`);
			}
		} catch (reason) {
			if (isMusicVersionConflict(reason)) {
				await load();
				setConflict(true);
				setMessage("歌曲已被其他管理员修改，现已刷新最新内容，请重新提交。");
			} else {
				setMessage(reason instanceof Error ? reason.message : "保存失败");
			}
		} finally {
			setBusy(false);
		}
	};

	const toggleArchive = async () => {
		if (!songId || !detail) return;
		const archive = detail.status === "active";
		if (archive && !window.confirm("归档后歌曲将从公开歌单隐藏，是否继续？"))
			return;
		setBusy(true);
		setMessage(null);
		setConflict(false);
		try {
			await setSongArchived(session.token, songId, detail.version, archive);
			await load();
		} catch (reason) {
			if (isMusicVersionConflict(reason)) {
				await load();
				setConflict(true);
				setMessage("歌曲状态已被其他管理员修改，现已刷新，请重试。");
			} else {
				setMessage(reason instanceof Error ? reason.message : "状态修改失败");
			}
		} finally {
			setBusy(false);
		}
	};

	return (
		<section>
			<SongEditorHeader
				songId={songId}
				title={draft.title}
				status={detail?.status ?? null}
			/>
			<form className={styles.songForm} onSubmit={save}>
				<label>
					<span>歌名</span>
					<input
						value={draft.title}
						onChange={(event) => set("title", event.target.value)}
						required
					/>
				</label>
				<label>
					<span>作者显示</span>
					<input
						value={draft.artist}
						onChange={(event) => set("artist", event.target.value)}
						required
					/>
				</label>
				<label>
					<span>作者列表</span>
					<input
						value={artistsText}
						onChange={(event) => setArtistsText(event.target.value)}
						placeholder="多位作者用 / 分隔"
						required
					/>
				</label>
				<label>
					<span>类型</span>
					<input
						value={draft.genre}
						onChange={(event) => set("genre", event.target.value)}
						required
					/>
				</label>
				<label>
					<span>语言</span>
					<input
						value={draft.language}
						onChange={(event) => set("language", event.target.value)}
						required
					/>
				</label>
				<label>
					<span>作品属性</span>
					<select
						value={draft.work_type}
						onChange={(event) => set("work_type", event.target.value)}
					>
						<option>翻唱</option>
						<option>原创</option>
					</select>
				</label>
				<label>
					<span>元数据状态</span>
					<select
						value={draft.metadata_status}
						onChange={(event) => set("metadata_status", event.target.value)}
					>
						<option value="complete">完整</option>
						<option value="incomplete">待补充</option>
					</select>
				</label>
				<label className={styles.full}>
					<span>备注</span>
					<textarea
						value={draft.notes}
						onChange={(event) => set("notes", event.target.value)}
						rows={4}
					/>
				</label>
				<div className={`${styles.formActions} ${styles.full}`}>
					<button className={styles.primary} type="submit" disabled={busy}>
						<Save size={16} />
						{busy ? "保存中…" : "保存歌曲"}
					</button>
					{detail ? (
						<button
							type="button"
							onClick={() => void toggleArchive()}
							disabled={busy}
						>
							{detail.status === "active" ? (
								<Archive size={16} />
							) : (
								<RotateCcw size={16} />
							)}
							{detail.status === "active" ? "归档歌曲" : "恢复公开"}
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
			{songId && detail ? (
				<PerformanceManager
					token={session.token}
					songId={songId}
					songVersion={detail.version}
					performances={detail.performances}
					onChanged={load}
				/>
			) : null}
		</section>
	);
};
