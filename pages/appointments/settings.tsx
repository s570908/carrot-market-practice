import React from "react";
import Layout from "@components/Layout";
import PushNotificationToggle from "@components/PushNotificationToggle";

export default function AppointmentSettings() {
  return (
    <Layout title="알림 설정" seoTitle="알림 설정 페이지" canGoBack>
      <div className="px-4 py-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900">알림 설정</h2>
          <p className="mt-1 text-sm text-gray-500">
            약속과 관련된 알림 설정을 관리할 수 있습니다.
          </p>
        </div>

        <div className="space-y-6 rounded-md border border-gray-200 bg-white p-4">
          <PushNotificationToggle />

          <hr className="border-t border-gray-200" />

          {/* 다른 알림 설정 옵션들 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">이메일 알림</h3>
              <p className="text-xs text-gray-500">약속 관련 알림을 이메일로 받습니다</p>
            </div>
            <input type="checkbox" className="h-4 w-4 rounded text-orange-500" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">약속 확정 알림</h3>
              <p className="text-xs text-gray-500">약속이 확정되면 알림을 받습니다</p>
            </div>
            <input type="checkbox" className="h-4 w-4 rounded text-orange-500" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">참가자 응답 알림</h3>
              <p className="text-xs text-gray-500">참가자가 응답하면 알림을 받습니다</p>
            </div>
            <input type="checkbox" className="h-4 w-4 rounded text-orange-500" defaultChecked />
          </div>
        </div>
      </div>
    </Layout>
  );
}
