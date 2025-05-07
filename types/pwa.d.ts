/**
 * PWA 관련 타입 정의
 */
interface BeforeInstallPromptEvent extends Event {
  /**
   * 설치 프롬프트를 표시하는 메서드
   */
  prompt(): Promise<void>;
  
  /**
   * 사용자의 응답을 나타내는 객체
   */
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

// Window 인터페이스에 beforeinstallprompt 이벤트 추가
interface WindowEventMap {
  'beforeinstallprompt': BeforeInstallPromptEvent;
}
