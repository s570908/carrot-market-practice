import React from "react";
import usePushNotification from "@libs/client/usePushNotification";

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
    subscribeToNotifications,
    unsubscribeFromNotifications,
  } = usePushNotification();

  if (!isPushSupported) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        이 브라우저는 푸시 알림을 지원하지 않습니다.
      </div>
    );
  }

  const handleToggle = async () => {
    if (subscription) {
      await unsubscribeFromNotifications();
    } else {
      await subscribeToNotifications();
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex-grow">
        <h3 className="text-sm font-medium text-gray-900">푸시 알림</h3>
        <p className="text-xs text-gray-500">
          {subscription
            ? "약속 알림을 실시간으로 받습니다"
            : "알림을 활성화하여 중요한 약속 업데이트를 놓치지 마세요"}
        </p>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>

      <button
        onClick={handleToggle}
        disabled={isSubscribing}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
          subscription ? "bg-orange-500" : "bg-gray-200"
        } ${isSubscribing ? "opacity-50" : ""}`}
      >
        <span className="sr-only">{subscription ? "알림 끄기" : "알림 켜기"}</span>
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            subscription ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
