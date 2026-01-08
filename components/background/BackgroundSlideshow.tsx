'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useBackgroundAnimation } from './useBackgroundAnimation';

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

export const BackgroundSlideshow = () => {
  const { enabled } = useBackgroundAnimation();
  const [isMobile, setIsMobile] = useState(getIsMobile);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isFading, setIsFading] = useState(false);
  const currentRef = useRef(currentIndex);

  const images = useMemo(() => (isMobile ? MOBILE_IMAGES : DESKTOP_IMAGES), [isMobile]);
  const imageKey = images.join('|');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(getIsMobile());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    currentRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    setCurrentIndex(0);
    setNextIndex(images.length > 1 ? 1 : 0);
    setIsFading(false);
  }, [imageKey, images.length]);

  useEffect(() => {
    if (!enabled || images.length < 2) {
      setIsFading(false);
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

  const showNext = enabled && isFading;

  return (
    <div className="background-slideshow" aria-hidden="true">
      <div
        className="background-layer"
        style={{
          backgroundImage: `url(${images[currentIndex]})`,
          opacity: 1
        }}
      />
      <div
        className="background-layer"
        style={{
          backgroundImage: `url(${images[nextIndex]})`,
          opacity: showNext ? 1 : 0
        }}
      />
    </div>
  );
};
