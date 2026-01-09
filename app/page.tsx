'use client';

import { useEffect, useState } from 'react';

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

  return (
    <div className="home-page">
      <img
        src="/images/icon/avatar.jpg"
        alt="avatar"
        className="home-avatar"
      />
      <div className="home-title">花礼Harei</div>
      <img
        src="/images/icon/bilibili.png"
        alt="bilibili"
        className="home-bilibili"
      />
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
