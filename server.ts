import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initializeAlarmScheduler } from './libs/server/alarmScheduler';

// 이 부분이 Next.js 앱을 초기화합니다
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });  // Next.js 앱 인스턴스 생성
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;
const HOST = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${PORT}`;

app.prepare().then(() => {  // Next.js 앱 준비
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);  // HTTP 요청을 Next.js 앱으로 전달
  });

  // Socket.IO 코드 제거 - API 라우트에서 처리됨

  server.listen(PORT, async () => {
    console.log(`> Server ready on http://localhost:${PORT}`);
    
    // 알람 스케줄러 초기화 및 기존 알람 다시 로드
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${PORT}`;
      const rescheduledCount = await initializeAlarmScheduler(baseUrl);
      console.log(`> Rescheduled ${rescheduledCount} alarms from database using alarmScheduler`);
    } catch (error) {
      console.error('Failed to initialize alarm scheduler:', error);
    }
  });
});