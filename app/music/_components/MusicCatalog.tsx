"use client";

import { ArrowUp } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MusicFilters } from "@/app/music/_components/MusicFilters";
import { SongDialog } from "@/app/music/_components/SongDialog";
import { SongList } from "@/app/music/_components/SongList";
import {
	getSong,
	listMusic,
	type MusicSort,
	type SearchMode,
} from "@/lib/music/client";
import type {
	MusicListResponse,
	SongDetailResponse,
	SongSummary,
} from "@/lib/music/schemas";
import styles from "../music.module.css";

const EMPTY_FACETS: MusicListResponse["facets"] = {
	genres: [],
	languages: [],
	workTypes: [],
};

export const MusicCatalog = () => {
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [searchMode, setSearchMode] = useState<SearchMode>("title");
	const [genre, setGenre] = useState("");
	const [language, setLanguage] = useState("");
	const [workType, setWorkType] = useState("");
	const [sort, setSort] = useState<MusicSort>("title");
	const [songs, setSongs] = useState<readonly SongSummary[]>([]);
	const [facets, setFacets] = useState(EMPTY_FACETS);
	const [total, setTotal] = useState(0);
	const [stats, setStats] = useState({ song_count: 0, performance_count: 0 });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selected, setSelected] = useState<SongDetailResponse["item"] | null>(
		null,
	);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogLoading, setDialogLoading] = useState(false);
	const [dialogError, setDialogError] = useState<string | null>(null);
	const detailRequest = useRef(0);
	const headingRef = useRef<HTMLElement>(null);
	const [showBackToTop, setShowBackToTop] = useState(false);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			setDebouncedQuery(query.trim());
		}, 240);
		return () => window.clearTimeout(timer);
	}, [query]);

	useEffect(() => {
		let active = true;
		setLoading(true);
		setError(null);
		void listMusic({
			q: debouncedQuery || undefined,
			searchMode,
			genre: genre || undefined,
			language: language || undefined,
			workType: workType || undefined,
			sort,
			order: sort === "title" ? "asc" : "desc",
			page: 1,
			pageSize: 1000,
		})
			.then((response) => {
				if (!active) return;
				setSongs(response.items);
				setFacets(response.facets);
				setTotal(response.total);
				setStats(response.stats);
			})
			.catch((reason: unknown) => {
				if (!active) return;
				setError(
					reason instanceof Error
						? reason.message
						: "歌单加载失败，请稍后再试。",
				);
				setSongs([]);
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, [debouncedQuery, genre, language, searchMode, sort, workType]);

	useEffect(() => {
		const heading = headingRef.current;
		if (!heading) return;
		const observer = new IntersectionObserver(
			([entry]) => setShowBackToTop(!entry.isIntersecting),
			{ threshold: 0 },
		);
		observer.observe(heading);
		return () => observer.disconnect();
	}, []);

	const reset = () => {
		setQuery("");
		setSearchMode("title");
		setGenre("");
		setLanguage("");
		setWorkType("");
		setSort("title");
	};

	const openSong = (song: SongSummary) => {
		const request = detailRequest.current + 1;
		detailRequest.current = request;
		setDialogOpen(true);
		setDialogLoading(true);
		setDialogError(null);
		setSelected(null);
		void getSong(song.source_key)
			.then((response) => {
				if (detailRequest.current === request) setSelected(response.item);
			})
			.catch((reason: unknown) => {
				if (detailRequest.current === request) {
					setDialogError(
						reason instanceof Error ? reason.message : "歌曲详情加载失败。",
					);
				}
			})
			.finally(() => {
				if (detailRequest.current === request) setDialogLoading(false);
			});
	};

	return (
		<section className={styles.catalog} aria-labelledby="music-catalog-title">
			<header ref={headingRef} className={styles.heading}>
				<div className={styles.identity}>
					<span className={styles.identityIcon} aria-hidden="true">
						<Image
							className={styles.identityImage}
							src="/images/icon/harei-singing.gif"
							alt=""
							width={96}
							height={96}
							priority
							unoptimized
						/>
					</span>
					<div>
						<p>HAREI SONGBOOK</p>
						<h1 id="music-catalog-title">花礼歌单</h1>
					</div>
				</div>
				<div className={styles.stats}>
					<strong>{stats.song_count}</strong> 首歌 · {stats.performance_count}{" "}
					次演唱
				</div>
			</header>

			<MusicFilters
				query={query}
				searchMode={searchMode}
				genre={genre}
				language={language}
				workType={workType}
				sort={sort}
				facets={facets}
				onQueryChange={setQuery}
				onSearchModeChange={(value) => {
					setSearchMode(value);
				}}
				onGenreChange={(value) => {
					setGenre(value);
				}}
				onLanguageChange={(value) => {
					setLanguage(value);
				}}
				onWorkTypeChange={(value) => {
					setWorkType(value);
				}}
				onSortChange={(value) => {
					setSort(value);
				}}
				onReset={reset}
			/>

			<div className={styles.resultBar} aria-live="polite">
				<p>{error ? error : `找到 ${total} 首歌曲`}</p>
				<span>{songs.length > 0 ? `已显示 ${songs.length} 首` : null}</span>
			</div>
			<SongList
				songs={songs}
				loading={loading}
				onOpen={openSong}
			/>
			<SongDialog
				open={dialogOpen}
				loading={dialogLoading}
				detail={selected}
				error={dialogError}
				onClose={() => {
					detailRequest.current += 1;
					setDialogOpen(false);
				}}
			/>
			<button
				className={`${styles.backToTop} ${showBackToTop ? styles.backToTopVisible : ""}`}
				type="button"
				aria-label="返回页面顶部"
				aria-hidden={!showBackToTop}
				tabIndex={showBackToTop ? 0 : -1}
				onClick={() => {
					const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
						? "auto"
						: "smooth";
					window.scrollTo({ top: 0, behavior });
				}}
			>
				<ArrowUp aria-hidden="true" size={22} />
			</button>
		</section>
	);
};
