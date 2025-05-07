import React from "react";
/**
 * Heroicons v2 사용 방법:
 * 
 * 설치:
 * yarn add @heroicons/react@v2
 * 또는
 * npm install @heroicons/react@v2
 * 
 * v2에서 달라진 점:
 * 1. import 경로가 변경됨: "@heroicons/react/24/outline" 또는 "@heroicons/react/24/solid"
 * 2. 일부 아이콘 이름 변경: XIcon → XMarkIcon
 * 3. 타입스크립트 지원 내장
 */

// v2 방식으로 import
import { BellIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface NotificationSetupModalProps {
  isOpen: boolean;
  onSetup: () => void;
  onSkip: () => void;
}

export default function NotificationSetupModal({
  isOpen,
  onSetup,
  onSkip,
}: NotificationSetupModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md p-6 mx-auto bg-white rounded-lg shadow-xl">
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="닫기"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center w-16 h-16 mb-4 bg-orange-100 rounded-full">
            <BellIcon className="w-8 h-8 text-orange-500" />
          </div>

          <h3 className="mb-2 text-lg font-medium text-gray-900">
            약속 알림을 설정하시겠습니까?
          </h3>
          
          <p className="mb-6 text-sm text-center text-gray-500">
            약속 시간, 변경 사항, 참가자 응답 등에 대한 알림을 받을 수 있습니다.
            지금 설정하면 중요한 약속 정보를 놓치지 않아요!
          </p>

          <div className="flex flex-col w-full space-y-3">
            <button
              onClick={onSetup}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              알림 설정하기
            </button>
            
            <button
              onClick={onSkip}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              나중에 하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
