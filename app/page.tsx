'use client';

import { useEffect, useRef, useState } from 'react';

type LiveStatus = {
  status: number | null;
  liveTime?: number | null;
};

const RANDOM_TEXTS = [
  "懒得喷！","妈呀","llbc", "礼礼不串","看看我的迎客松","玩网姐，唯有敬佩",
  "155不可能再低了", "75毫米的大唧吧","花礼美乃滋","礼礼不窜",
  "跟水蜜桃一样紧致翘弹白皙","两个大凶","鼠今色","看的几几年年的","你戴个皮筋骗我是超薄"
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getUtc8Timestamp = (timestamp: number) => {
  const offsetMinutes = new Date(timestamp).getTimezoneOffset();
  const utcTime = timestamp + offsetMinutes * 60 * 1000;
  return utcTime + 8 * 60 * 60 * 1000;
};

const getUtc8Date = (timestamp: number) => {
  const utc8Timestamp = getUtc8Timestamp(timestamp);
  return new Date(utc8Timestamp);
};

const getUtc8DayStart = (timestamp: number) => {
  const utc8Date = getUtc8Date(timestamp);
  return Date.UTC(
    utc8Date.getUTCFullYear(),
    utc8Date.getUTCMonth(),
    utc8Date.getUTCDate()
  );
};

const parseLiveTime = (value?: string) => {
  if (!value) return null;
  const [datePart, timePart] = value.trim().split(' ');
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  if ([year, month, day, hour, minute, second].some((item) => Number.isNaN(item))) {
    return null;
  }
  return Date.UTC(year, month - 1, day, hour - 8, minute, second);
};

const formatDuration = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export default function HomePage() {
  const [now, setNow] = useState(() => Date.now());
  const [liveStatus, setLiveStatus] = useState<LiveStatus>({ status: null, liveTime: null });
  const [randomText, setRandomText] = useState(() => RANDOM_TEXTS[0]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fireworksRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setRandomText(RANDOM_TEXTS[Math.floor(Math.random() * RANDOM_TEXTS.length)]);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const response = await fetch('https://api.harei.cn/live/status', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('live status failed');
        }
        const data = (await response.json()) as { status?: number; live_time?: string };
        const liveTime = parseLiveTime(data.live_time);
        if (isMounted) {
          setLiveStatus({ status: typeof data.status === 'number' ? data.status : 0, liveTime });
        }
      } catch (error) {
        if (isMounted) {
          setLiveStatus({ status: 0, liveTime: null });
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const nowUtc8DayStart = getUtc8DayStart(now);
  const debutStart = Date.UTC(2024, 6, 15);
  const debutDays = Math.max(0, Math.floor((nowUtc8DayStart - debutStart) / MS_PER_DAY));

  const utc8Date = getUtc8Date(now);
  const currentYear = utc8Date.getUTCFullYear();
  const birthdayThisYear = Date.UTC(currentYear, 2, 1);
  const birthdayTarget = nowUtc8DayStart > birthdayThisYear
    ? Date.UTC(currentYear + 1, 2, 1)
    : birthdayThisYear;

  const debutAnniversaryThisYear = Date.UTC(currentYear, 6, 16);
  const debutAnniversaryTarget = nowUtc8DayStart > debutAnniversaryThisYear
    ? Date.UTC(currentYear + 1, 6, 16)
    : debutAnniversaryThisYear;

  const birthdayDiff = Math.floor((birthdayTarget - nowUtc8DayStart) / MS_PER_DAY);
  const debutAnniversaryDiff = Math.floor(
    (debutAnniversaryTarget - nowUtc8DayStart) / MS_PER_DAY
  );

  const isBirthday = nowUtc8DayStart === birthdayThisYear;
  const isDebutAnniversary = nowUtc8DayStart === debutAnniversaryThisYear;

  const liveText =
    liveStatus.status === 1 && liveStatus.liveTime
      ? `开播中 ${formatDuration(now - liveStatus.liveTime)}`
      : '未开播';

  useEffect(() => {
    if (!isBirthday) return undefined;
    const audio = audioRef.current;
    if (!audio) return undefined;

    let cleanup = () => {};

    const tryPlay = () => audio.play().catch(() => {
      // Ignore autoplay restrictions.
    });

    const handleUserGesture = () => {
      tryPlay();
      cleanup();
    };

    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {
        document.addEventListener('click', handleUserGesture, { once: true });
        cleanup = () => document.removeEventListener('click', handleUserGesture);
      });
    }

    return () => {
      cleanup();
      audio.pause();
      audio.currentTime = 0;
    };
  }, [isBirthday]);

  useEffect(() => {
    if (!isBirthday) return undefined;
    const canvas = fireworksRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const colors = [
      '#ffd700',
      '#ff4d4f',
      '#ff7a45',
      '#ffa940',
      '#bae637',
      '#2f54eb',
      '#13c2c2',
      '#52c41a',
      '#f759ab',
      '#9254de',
      '#36cfc9',
      '#40a9ff',
    ];
    const maxRockets = 3;
    const maxParticles = 300;
    const rockets: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      targetY: number;
      color: string;
    }> = [];
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    let lastLaunch = 0;
    let animationId = 0;

    const launchRocket = () => {
      const width = canvas.width;
      const height = canvas.height;
      const targetY = height * (0.35 + Math.random() * 0.25);
      if (rockets.length >= maxRockets) return;
      rockets.push({
        x: Math.random() * width,
        y: height + 20,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(12 + Math.random() * 5),
        targetY,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    };

    const explode = (rocket: typeof rockets[number]) => {
      const count = 70 + Math.floor(Math.random() * 40);
      for (let i = 0; i < count; i += 1) {
        if (particles.length >= maxParticles) break;
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.4 + Math.random() * 4.6;
        particles.push({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 60 + Math.random() * 35,
          color: rocket.color,
        });
      }
    };

    const draw = () => {
      animationId = requestAnimationFrame(draw);

      const nowTime = performance.now();
      if (nowTime - lastLaunch > 420) {
        launchRocket();
        lastLaunch = nowTime;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.globalCompositeOperation = 'lighter';
      context.globalAlpha = 1;

      for (let i = rockets.length - 1; i >= 0; i -= 1) {
        const rocket = rockets[i];
        rocket.x += rocket.vx;
        rocket.y += rocket.vy;
        rocket.vy += 0.07;

        context.beginPath();
        context.fillStyle = rocket.color;
        context.shadowBlur = 8;
        context.shadowColor = rocket.color;
        context.arc(rocket.x, rocket.y, 2.8, 0, Math.PI * 2);
        context.fill();

        if (rocket.y <= rocket.targetY || rocket.vy >= 0) {
          explode(rocket);
          rockets.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.045;
        particle.life -= 1;

        const alpha = Math.max(0, particle.life / 90);
        context.beginPath();
        context.fillStyle = `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        context.shadowBlur = 9;
        context.shadowColor = particle.color;
        context.arc(particle.x, particle.y, 2.2, 0, Math.PI * 2);
        context.fill();

        if (particle.life <= 0) {
          particles.splice(i, 1);
        }
      }

      context.restore();
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
      rockets.splice(0, rockets.length);
      particles.splice(0, particles.length);
    };
  }, [isBirthday]);

  return (
    <div className="home-page">
      {isBirthday && (
        <>
          <audio
            ref={audioRef}
            src="/music/birthday.mp3"
            loop
            preload="auto"
          />
          <canvas ref={fireworksRef} className="birthday-fireworks" aria-hidden="true" />
        </>
      )}
      <img
        src="/images/icon/avatar.jpg"
        alt="avatar"
        className="home-avatar"
      />
      <div className="home-title">花礼Harei</div>
      <a
        href="https://live.bilibili.com/1820703922"
        target="_blank"
        rel="noreferrer noopener"
        aria-label="前往Bilibili直播间"
      >
        <img
          src="/images/icon/bilibili.png"
          alt="bilibili"
          className="home-bilibili"
        />
      </a>
      <div className="info-box">{liveText}</div>
      <div className="countdown-wrapper" tabIndex={0}>
        <div className="info-box">纪念日倒计时</div>
        <div className="countdown-pop">
          <div>花礼Harei已出道{debutDays}天</div>
          <div>
            {isBirthday
              ? '祝花礼Harei生日快乐！'
              : `距离花礼Harei生日还剩${birthdayDiff}天`}
          </div>
          <div>
            {isDebutAnniversary
              ? '祝花礼Harei周年快乐！'
              : `距离花礼Harei出道日还剩${debutAnniversaryDiff}天`}
          </div>
        </div>
      </div>
      <div className="home-links">
        <a className="home-link" href="/music">
          <img src="/images/icon/music-l.png" alt="歌单" className="home-link-icon" />
          <span>歌单</span>
        </a>
        <a className="home-link" href="/box">
          <img src="/images/icon/box-l.png" alt="提问箱" className="home-link-icon" />
          <span>提问箱</span>
        </a>
        <a className="home-link" href="/huangdou">
          <img src="/images/icon/huangdou.png" alt="豆力榜" className="home-link-icon" />
          <span>豆力榜</span>
        </a>
      </div>
      <div className="home-random-text">{randomText}</div>
      <div className="home-beian">
        <a href="https://beian.miit.gov.cn" target="_blank" rel="noreferrer noopener">
          陕ICP备2024053986号-1
        </a>
      </div>
    </div>
  );
}
