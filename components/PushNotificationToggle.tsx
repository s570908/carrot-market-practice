/**
 * PushNotificationToggle 컴포넌트 상세 설명
 * 
 * 용도:
 * - 사용자가 앱의 푸시 알림을 활성화/비활성화할 수 있는 토글 인터페이스 제공
 * - 푸시 알림 상태와 관련된 피드백 및 안내 메시지 표시
 * - 브라우저 호환성 및 권한 상태 관리
 * 
 * 주요 기능:
 * 1. 푸시 알림 호환성 검사
 *    - 브라우저가 푸시 알림을 지원하지 않을 경우 안내 메시지 표시
 * 
 * 2. 구독 상태 관리
 *    - 현재 구독 상태에 따라 토글 스위치의 ON/OFF 상태 조정
 *    - 토글 버튼을 통해 푸시 알림 구독/구독 취소 기능 제공
 * 
 * 3. 사용자 권한 관리
 *    - 사용자가 이전에 알림 권한을 거부한 경우 브라우저 설정 변경 안내
 *    - 권한 상태에 따른 맞춤형 안내 메시지 표시
 * 
 * 4. 상태 피드백 제공
 *    - 구독 중/해지 중 상태를 시각적으로 표시 (버튼 비활성화, 투명도 조정)
 *    - 오류 발생 시 오류 메시지 표시
 * 
 * 5. 접근성 지원
 *    - 스크린 리더 지원을 위한 ARIA 속성 포함
 *    - 시각적 상태와 일치하는 접근성 정보 제공
 * 
 * 구현 방식:
 * - usePushNotification 커스텀 훅을 사용하여 푸시 알림 관련 로직 처리
 * - 로컬 상태(isToggling)로 UI 상호작용 관리
 * - 조건부 렌더링을 통해 다양한 상태에 따른 UI 표시
 * - TailwindCSS를 사용한 스타일링
 * 
 * 주요 사용처:
 * - 사용자 프로필 페이지
 * - 설정/환경설정 페이지
 * - 앱 최초 실행 시 알림 권한 요청 화면
 * - 사용자 활동이 많은 페이지에서의 알림 활성화 유도
 */

import React, { useState } from "react";
import usePushNotification from "@/libs/client/usePushNotification";

interface PushNotificationToggleProps {
  className?: string;
}

export default function PushNotificationToggle({ className = "" }: PushNotificationToggleProps) {
  const {
    isPushSupported,
    hasPermission,
    subscription, 
    isSubscribing,
    error,
    isIncognito,
    subscribeToNotifications,
    unsubscribeFromNotifications,
  } = usePushNotification();
  
  // 상태 변경 중 UI 피드백을 위한 로컬 상태 추가
  const [isToggling, setIsToggling] = useState(false);

  if (!isPushSupported) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        이 브라우저는 푸시 알림을 지원하지 않습니다.
      </div>
    );
  }

  const handleToggle = async () => {
    console.log("push alarm button clicked! 푸시 알림 상태 전환 중...");
    console.log("변경전 subscription:", subscription);
    console.log("변경전 hasPermission:", hasPermission);
    console.log("변경전 isSubscribing:", isSubscribing);
    setIsToggling(true);
    try {
      if (subscription) {
        await unsubscribeFromNotifications();
      } else {
        // 권한이 없는 경우 사용자에게 안내
        if (!hasPermission && Notification.permission === "denied") {
          alert("브라우저 설정에서 알림 권한을 허용해주세요.");
          return;
        }
        await subscribeToNotifications();
      }
    } catch (e) {
      console.error("알림 상태 전환 중 오류 발생:", e);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      {isIncognito && (
        <div className="p-2 mb-3 text-sm text-white bg-yellow-500 rounded">
          <strong>시크릿 창에서는 푸시 알림을 사용할 수 없습니다.</strong><br/>
          브라우저의 보안 정책으로 인해 시크릿 창(인코그니토 모드)에서는 
          푸시 알림 권한이 자동으로 차단됩니다. 일반 창으로 접속해 주세요.
        </div>
      )}
      <div className="flex-grow">
        <h3 className="text-sm font-medium text-gray-900">푸시 알림</h3>
        <p className="text-xs text-gray-500">
          {subscription
            ? "약속 알림을 실시간으로 받습니다" // subscription이 true일 때 표시
            : hasPermission 
              ? "알림을 활성화하여 중요한 약속 업데이트를 놓치지 마세요"
              : "알림 권한을 허용하면 중요한 업데이트를 받을 수 있습니다"}
        </p>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>

      <button
        type="button"
        onClick={handleToggle}
        disabled={isSubscribing || isToggling}
        className={`relative inline-flex items-center justify-center h-8 w-14 flex-shrink-0 rounded-full border-2 ${subscription ? "border-transparent" : "border-gray-400"} transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 z-10
          ${subscription ? "bg-orange-500" : "bg-gray-400"} // subscription이 true일 때 오렌지색 배경
          ${(isSubscribing || isToggling) ? "opacity-70 cursor-not-allowed" : "hover:bg-opacity-80"}
        `}
        role="switch"
        aria-checked={!!subscription}
        tabIndex={0}
      >
        <span className="sr-only">{subscription ? "알림 끄기" : "알림 켜기"}</span>
        <span
          aria-hidden="true"
          className={`absolute pointer-events-none h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
            subscription ? "translate-x-3" : "translate-x-[-0.75rem]"
          }`}
        />
      </button>
    </div>
  );
}
