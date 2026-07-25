import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ManagedSongDetail } from "@/lib/music-admin/schemas";
import styles from "../form.module.css";

export const SongEditorHeader = ({
	songId,
	title,
	status,
}: {
	readonly songId: number | null;
	readonly title: string;
	readonly status: ManagedSongDetail["item"]["status"] | null;
}) => (
	<header className={styles.heading}>
		<div>
			<Link href="/music-admin/songs">
				<ArrowLeft size={16} />
				返回歌曲列表
			</Link>
			<p>SONG EDITOR</p>
			<h1>{songId ? title || "编辑歌曲" : "新增歌曲"}</h1>
		</div>
		{status ? (
			<span className={status === "active" ? styles.active : styles.archived}>
				{status === "active" ? "公开中" : "已归档"}
			</span>
		) : null}
	</header>
);
