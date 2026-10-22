'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useBackgroundAnimation } from './useBackgroundAnimation';
import { useHydrated } from '@/lib/use-hydrated';

const DESKTOP_IMAGES = [
  '/images/back/back1.jpg',
  '/images/back/back2.jpg',
  '/images/back/back3.jpg',
  '/images/back/back4.jpg',
  '/images/back/back5.jpg',
  '/images/back/back6.jpg'
];

const MOBILE_IMAGES = [
  '/images/mbback/mbback1.jpg',
  '/images/mbback/mbback2.jpg',
  '/images/mbback/mbback3.jpg',
  '/images/mbback/mbback4.jpg',
  '/images/mbback/mbback5.jpg',
  '/images/mbback/mbback6.jpg'
];

const getIsMobile = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  const ratio = width / Math.max(height, 1);
  return width <= 768 || ratio < 1;
};

const STORAGE_PREFIX = 'harei:bg-slideshow';

const getStorageKey = (area: string, imageKey: string) => `${STORAGE_PREFIX}:${area}:${imageKey}`;

const readStoredIndex = (area: string, imageKey: string, length: number) => {
  if (typeof window === 'undefined') {
    return 0;
  }
  const stored = window.localStorage.getItem(getStorageKey(area, imageKey));
  const parsed = Number(stored);
  if (!stored || Number.isNaN(parsed) || length <= 0) {
    return 0;
  }
  return ((parsed % length) + length) % length;
};

const subscribeToResize = (onChange: () => void) => {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
};
const getServerIsMobile = () => false;

type SlideshowProps = {
  area: string;
  enabled: boolean;
  images: readonly string[];
};

const Slideshow = ({ area, enabled, images }: SlideshowProps) => {
  const hydrated = useHydrated();
  const imageKey = images.join('|');
  const [currentIndex, setCurrentIndex] = useState(() => readStoredIndex(area, imageKey, images.length));
  const [nextIndex, setNextIndex] = useState(() => (readStoredIndex(area, imageKey, images.length) + 1) % images.length);
  const [isFading, setIsFading] = useState(false);
  const currentRef = useRef(currentIndex);

  useEffect(() => {
    currentRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    window.localStorage.setItem(getStorageKey(area, imageKey), String(currentIndex));
  }, [area, imageKey, currentIndex, hydrated]);

  useEffect(() => {
    if (!enabled || images.length < 2) {
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      const next = (currentRef.current + 1) % images.length;
      setNextIndex(next);
      setIsFading(true);

      timeout = setTimeout(() => {
        setCurrentIndex(next);
        currentRef.current = next;
        setIsFading(false);
      }, 1000);
    }, 5000);

    return () => {
      clearInterval(interval);
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [enabled, images.length]);

  const showNext = hydrated && enabled && isFading;

  return (
    <div className="background-slideshow" aria-hidden="true">
      <div
        className="background-layer"
        style={{
          backgroundImage: `url(${images[hydrated ? currentIndex : 0]})`,
          opacity: 1
        }}
      />
      <div
        className="background-layer"
        style={{
          backgroundImage: `url(${images[hydrated ? nextIndex : 1]})`,
          opacity: showNext ? 1 : 0
        }}
      />
    </div>
  );
};

export const BackgroundSlideshow = () => {
  const { enabled, area } = useBackgroundAnimation();
  const isMobile = useSyncExternalStore(subscribeToResize, getIsMobile, getServerIsMobile);
  const images = isMobile ? MOBILE_IMAGES : DESKTOP_IMAGES;
  return <Slideshow key={`${area}:${isMobile}:${enabled}`} area={area} enabled={enabled} images={images} />;
};
