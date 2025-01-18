import dayjs from "dayjs";
import "dayjs/locale/ko"; // 한국어 포맷 적용
import timezone from "dayjs/plugin/timezone"; // 타임존 플러그인
import utc from "dayjs/plugin/utc"; // UTC 플러그인

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ko");

interface TimeFormatProps {
  date: Date | string; // 날짜 또는 문자열로 입력
  timeZone?: string; // 기본 타임존은 Asia/Seoul
  className?: string; // TailwindCSS 클래스 추가 가능
}

export default function TimeFormat({
  date,
  timeZone = "Asia/Seoul",
  className,
}: TimeFormatProps) {
  const parsedDate = dayjs(date).tz(timeZone);

  const hour = parsedDate.hour();
  const minute = parsedDate.minute();
  const ampm = hour < 12 ? "오전" : "오후";
  const formattedHour = hour % 12 || 12; // 12시간제 포맷
  const formattedMinute = minute < 10 ? `0${minute}` : minute;

  return (
    <span className={className}>
      {`${ampm} ${formattedHour}:${formattedMinute}`}
    </span>
  );
}
