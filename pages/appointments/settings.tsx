/**
 * AppointmentSettings 페이지 컴포넌트
 * 
 * 용도:
 * - 사용자가 약속 관련 알림 설정을 관리할 수 있는 설정 페이지
 * - 푸시 알림, 이메일 알림 등 다양한 알림 채널 설정 제공
 * - 알림 유형별 ON/OFF 토글 기능 제공
 * 
 * 접근 방법:
 * - 웹 애플리케이션에서 /appointments/settings URL로 접근
 * - 일반적으로 사용자 프로필이나 대시보드의 설정 메뉴에서 링크됨
 * - 약속 관련 페이지에서의 "알림 설정" 링크를 통해 접근 가능
 * 
 * 주요 기능:
 * 1. 푸시 알림 토글 - PushNotificationToggle 컴포넌트 활용
 * 2. 이메일 알림 설정
 * 3. 약속 확정 알림 설정
 * 4. 참가자 응답 알림 설정
 * 
 * 구조:
 * - Layout 컴포넌트를 사용하여 일관된 UI 제공
 * - 페이지 제목 및 설명
 * - 알림 설정 옵션들이 있는 카드 형태의 컨테이너
 * - 각 설정 항목은 제목, 설명, 토글/체크박스로 구성
 * 
 * AppointmentSettings 페이지의 권장 사용 방법
 * 
 * 1. 통합 설정 페이지로 활용:
 *    - 약속 관련 모든 설정을 한 곳에서 관리하는 중앙 허브로 활용
 *    - 알림 설정뿐만 아니라 기본 약속 시간, 자동 응답 등 추가 설정 포함 가능
 * 
 * 2. 사용자 접근 경로:
 *    - 약속 목록 페이지(/appointments)에서 설정 아이콘을 통해 접근
 *    - 사용자 프로필 페이지의 설정 섹션에서 "약속 알림 설정" 링크로 접근
 *    - 앱 전체 설정 페이지에서 "약속 관리" 카테고리 아래 위치
 * 
 * 3. 설정 저장 및 동기화:
 *    - 각 설정 변경 시 자동 저장 (useMutation으로 API 호출)
 *    - 설정 변경 성공/실패 시 토스트 알림 표시
 *    - 설정이 다른 기기와 동기화됨을 사용자에게 알림
 * 
 * 4. 개인화 및 상황별 추천:
 *    - 사용자의 앱 사용 패턴에 따라 권장 설정 제안
 *    - 약속이 많은 사용자에게는 중요 알림만 받도록 추천
 *    - 처음 방문 시 가이드 투어 제공
 * 
 * 5. 알림 테스트 기능:
 *    - 각 알림 유형의 테스트 버튼으로 사용자가 알림을 미리 확인 가능
 *    - "테스트 알림 보내기" 버튼을 통해 설정이 제대로 작동하는지 검증
 * 
 * AppointmentSettings 페이지의 구체적인 사용 사례
 * 
 * 사례 1: 첫 약속 생성 후 알림 설정 안내
 * -----------------------------------
 * 1. 사용자가 앱에서 첫 약속을 생성함
 * 2. 약속 생성 완료 후 "약속 알림을 설정하시겠습니까?" 라는 안내 팝업 표시
 * 3. 사용자가 "설정하기"를 클릭하면 AppointmentSettings 페이지로 이동
 * 4. 푸시 알림을 활성화하도록 가이드하고, 첫 사용자는 브라우저 알림 권한 요청 경험
 * 5. 사용자는 자신에게 필요한 알림만 선택하여 활성화
 * 
 * 사례 2: 너무 많은 알림으로 인한 설정 조정
 * -----------------------------------
 * 1. 사용자가 여러 약속에 참여하여 알림이 과도하게 오는 상황 발생
 * 2. 알림 내 "알림 설정 관리" 링크를 통해 AppointmentSettings 페이지 접근
 * 3. 중요하지 않은 알림(예: 참가자 응답 알림)을 비활성화
 * 4. 변경 사항 저장 후 알림 빈도가 감소하여 사용자 경험 개선
 * 
 * 사례 3: 모바일 기기와 PC 알림 설정 동기화
 * -----------------------------------
 * 1. 사용자가 모바일에서 앱을 주로 사용하다가 PC에서 접속
 * 2. 프로필 메뉴의 "알림 설정"을 통해 AppointmentSettings 페이지로 이동
 * 3. 모바일에서의 알림 설정이 이미 동기화되어 있음 확인
 * 4. PC에서는 브라우저 푸시 알림을 추가로 활성화
 * 5. 이제 두 기기 모두에서 중요 약속 알림 수신 가능
 * 
 * 사례 4: 특정 유형의 약속만 알림 받기
 * -----------------------------------
 * 1. 사용자가 개인 약속과 업무 약속을 모두 앱에서 관리
 * 2. 주말에는 업무 알림을 받고 싶지 않아 설정 변경 필요
 * 3. 약속 목록 페이지의 필터 옆에 있는 설정 아이콘을 클릭하여 AppointmentSettings 접근
 * 4. "업무 약속 알림"을 비활성화하거나 요일/시간대 기준으로 알림 설정 조정
 * 5. 이제 주말에는 개인 약속 알림만 수신
 * 
 * 사례 5: 새로운 기기에서 앱 사용 시작
 * -----------------------------------
 * 1. 사용자가 새 기기에서 앱에 로그인
 * 2. 첫 화면에서 "중요 알림을 받으려면 알림 설정을 확인하세요" 배너 표시
 * 3. 배너를 클릭하여 AppointmentSettings 페이지로 이동
 * 4. 이전 기기의 설정이 그대로 표시되지만, 새 기기에서는 푸시 알림 권한 필요
 * 5. 푸시 알림 토글 활성화하고 권한 부여
 * 6. 이제 새 기기에서도 동일한 알림 환경 구성 완료
 */

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

        <div className="p-4 space-y-6 bg-white border border-gray-200 rounded-md">
          <PushNotificationToggle />

          <hr className="border-t border-gray-200" />

          {/* 다른 알림 설정 옵션들 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">이메일 알림</h3>
              <p className="text-xs text-gray-500">약속 관련 알림을 이메일로 받습니다</p>
            </div>
            <input type="checkbox" className="w-4 h-4 text-orange-500 rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">약속 확정 알림</h3>
              <p className="text-xs text-gray-500">약속이 확정되면 알림을 받습니다</p>
            </div>
            <input type="checkbox" className="w-4 h-4 text-orange-500 rounded" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">참가자 응답 알림</h3>
              <p className="text-xs text-gray-500">참가자가 응답하면 알림을 받습니다</p>
            </div>
            <input type="checkbox" className="w-4 h-4 text-orange-500 rounded" defaultChecked />
          </div>
        </div>
      </div>
    </Layout>
  );
}
