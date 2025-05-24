import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { loadAlarms } from './libs/server/alarmScheduler';

// 이 부분이 Next.js 앱을 초기화합니다
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });  // Next.js 앱 인스턴스 생성
const handle = app.getRequestHandler();

app.prepare().then(() => {  // Next.js 앱 준비
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);  // HTTP 요청을 Next.js 앱으로 전달
  });

  // Socket.IO 코드 제거 - API 라우트에서 처리됨

  // 서버가 시작될 때 알람 스케줄러 초기화
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  loadAlarms(baseUrl).then(count => {
    console.log(`> Loaded and scheduled ${count} upcoming alarms`);
  }).catch(error => {
    console.error('Failed to load alarms:', error);
  });

  server.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
  });
});