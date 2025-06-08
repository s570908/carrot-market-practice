import { useState, useEffect, useRef } from "react";
import Layout from "@components/Layout";
import { useQuery } from "@tanstack/react-query";
import useUser from "@libs/client/useUser";
import axios from "axios";
import { toast } from "react-toastify";

interface ChatRoom {
  id: number;
  product: {
    name: string;
  };
  recentMsg?: any;
}

interface ChatRoomResponse {
  ok: boolean;
  sellerChatRoomList: ChatRoom[];
}

const AlarmTest = () => {
  const { user } = useUser();
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [customRoomId, setCustomRoomId] = useState("");
  const [timeOffset, setTimeOffset] = useState(30); // 기본 30초 후
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testMode, setTestMode] = useState<'quick' | 'real'>('quick');
  const [realAppointmentTime, setRealAppointmentTime] = useState('');
  const [realAppointmentDate, setRealAppointmentDate] = useState('');
  const [realAlertOption, setRealAlertOption] = useState('10분 전');
  const [autoMonitorAlarmId, setAutoMonitorAlarmId] = useState<number | null>(null);
  const [monitorActive, setMonitorActive] = useState(false);
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 채팅방 목록 가져오기
  const { data: chatRoomsData, isLoading: isLoadingRooms, error: roomsError } = useQuery<ChatRoomResponse>({
    queryKey: ["chatRooms"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/chatRoomList?key=all");
        return response.data;
      } catch (error) {
        console.error("채팅방 목록 조회 오류:", error);
        return { ok: false, sellerChatRoomList: [] };
      }
    },
    enabled: !!user,
  });

  // 사용자 입력 채팅방 ID 적용
  const applyCustomRoomId = () => {
    if (!customRoomId.trim()) {
      toast.error("채팅방 ID를 입력해주세요");
      return;
    }
    
    const roomId = Number(customRoomId);
    if (isNaN(roomId) || roomId <= 0) {
      toast.error("유효한 채팅방 ID를 입력해주세요");
      return;
    }
    
    setSelectedRoom(roomId);
    toast.success(`채팅방 ID ${roomId}를 선택했습니다`);
    addTestResult(`채팅방 ID ${roomId} 선택됨`);
  };

  // 테스트 시스템 메시지 생성 함수
  const createTestSystemMessage = async () => {
    if (!selectedRoom) {
      toast.error("채팅방을 먼저 선택해주세요");
      return null;
    }

    try {
      setLoading(true);
      addTestResult("시스템 메시지 생성 중...");

      // 현재 시간 기준 생성
      const now = new Date();
      
      let appointmentTime: Date;
      let alarmTime: string;
      
      if (testMode === 'quick') {
        // 빠른 테스트 모드: 5분 후 약속, 테스트 알림
        appointmentTime = new Date(now.getTime() + 5 * 60 * 1000);
        alarmTime = "테스트 알림";
        addTestResult("빠른 테스트 모드: 5분 후 약속, 즉시 알림");
      } else {
        // 실제 모드: 사용자 입력 시간 약속, 실제 알림 옵션
        if (!realAppointmentDate || !realAppointmentTime) {
          toast.error("약속 날짜와 시간을 모두 입력해주세요");
          setLoading(false);
          return null;
        }
        
        appointmentTime = new Date(`${realAppointmentDate}T${realAppointmentTime}`);
       alarmTime = realAlertOption;
        addTestResult(`실제 테스트 모드: ${appointmentTime.toLocaleString()} 약속, ${alarmTime} 알림`);
      }

      // 1. 테스트용 약속 메시지 먼저 생성
      addTestResult(`약속 생성 중... 약속시간: ${appointmentTime.toISOString()}`);
      const appointmentResponse = await axios.post(`/api/chat-meetups`, {
        chatRoomId: selectedRoom,
        appointmentTime: appointmentTime.toISOString(),
        place: "테스트 위치",
        locationLatitude: 37.5665,
        locationLongitude: 126.9780,
       alarmTime:alarmTime
      });

      if (!appointmentResponse.data.ok) {
        throw new Error("가상 약속 생성 실패");
      }

      const chatMeetupId = appointmentResponse.data.chatMeetup?.id;
      const appointmentMessageId = appointmentResponse.data.message?.id;
      
      addTestResult(`가상 약속 생성 완료: 약속 ID ${chatMeetupId}, 메시지 ID ${appointmentMessageId}`);

      // 2. 알림 메시지 생성
      const systemMessageResponse = await axios.post("/api/chat/system-message", {
        chatRoomId: selectedRoom,
        message: "🔔 테스트 알림 메시지입니다",
        userId: user?.id,
        meta: {
          type: 'APPOINTMENT_ALERT',
          chatMeetupId, // 실제 생성된 약속 ID 사용
          appointmentMessageId, // 실제 생성된 메시지 ID 사용
          alarmTime: "테스트 알림"
        }
      });

      if (!systemMessageResponse.data.ok) {
        throw new Error("시스템 메시지 생성 실패");
      }

      addTestResult(`시스템 메시지 생성 완료: ID ${systemMessageResponse.data.systemMessage.id}`);
      return {
        ...systemMessageResponse.data.systemMessage,
        chatMeetupId // 추가 정보 전달
      };
    } catch (error) {
      console.error("시스템 메시지 생성 오류:", error);
      addTestResult(`시스템 메시지 생성 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 알림 설정 테스트 함수
  const testAlarmSettings = async () => {
    try {
      setLoading(true);

      // 1. 테스트용 시스템 메시지 생성
      const systemMessage = await createTestSystemMessage();
      if (!systemMessage) return;

      // 트리거 시간 설정
      let triggerAt: Date;
      let countdownSeconds: number;
      
      if (testMode === 'quick') {
        // 빠른 테스트: timeOffset 초 후에 알림
        const now = new Date();
        triggerAt = new Date(now.getTime() + timeOffset * 1000);
        countdownSeconds = timeOffset;
        
        addTestResult(`빠른 알람 설정 중... 트리거 시간: ${triggerAt.toISOString()}`);
        addTestResult(`현재 시간: ${now.toISOString()}`);
        addTestResult(`${timeOffset}초 후에 알림이 울릴 예정입니다...`);
      } else {
        // 실제 테스트: 약속 시간과 알림 옵션 기반 계산
        const appointmentTime = new Date(`${realAppointmentDate}T${realAppointmentTime}`);
        triggerAt = calculateTriggerTime(appointmentTime, realAlertOption);
        
        const now = new Date();
        const diffMs = triggerAt.getTime() - now.getTime();
        countdownSeconds = Math.floor(diffMs / 1000);
        
        // 포맷팅된 시간 표시
        const triggerTimeFormatted = triggerAt.toLocaleString();
        addTestResult(`실제 알람 설정 중... 트리거 시간: ${triggerTimeFormatted}`);
        
        // 인간 친화적 시간 표시
        const minutesUntilTrigger = Math.floor(countdownSeconds / 60);
        const hoursUntilTrigger = Math.floor(minutesUntilTrigger / 60);
        
        if (hoursUntilTrigger > 0) {
          addTestResult(`약 ${hoursUntilTrigger}시간 ${minutesUntilTrigger % 60}분 후에 알림이 울릴 예정입니다...`);
        } else {
          addTestResult(`약 ${minutesUntilTrigger}분 후에 알림이 울릴 예정입니다...`);
        }
      }

      // 3. 알람 설정 API 호출
      const response = await axios.post(`/api/chat/${selectedRoom}/alarm-settings`, {
        messageId: systemMessage.id,
        alarmTime: testMode === 'quick' ? "테스트 알림" : realAlertOption,
        triggerAt: triggerAt.toISOString(),
        disableAlarm: false
      });

      // 알람 설정 API 응답 로깅
      addTestResult(`API 응답: ${JSON.stringify(response.data)}`);

      if (!response.data.ok) {
        throw new Error(`알람 설정 실패: ${response.data.error || "알 수 없는 오류"}`);
      }

      // 성공 메시지와 함께 카운트다운 시작
      const alarmId = response.data.alarmSetting?.id;
      addTestResult(`알람 설정 완료: ID ${alarmId}`);
      
      // 자동 모니터링 설정
      if (alarmId) {
        setAutoMonitorAlarmId(alarmId);
        addTestResult(`알림 ID ${alarmId}에 대한 자동 모니터링이 가능합니다.`);
      }
      
      // 서버 알림 설정 성공 메시지
      addTestResult(`서버에 알림이 등록되었습니다. 알림 ID: ${alarmId}`);
      
      // 빠른 테스트 모드에서만 진행 상황 표시
      if (testMode === 'quick' && countdownSeconds < 60) {
        // 카운트다운 표시 (서버 알림 확인용)
        startCountdown(countdownSeconds);
      }
      
      toast.success(`🔔 알람이 설정되었습니다 - ID: ${alarmId}`);
    } catch (error) {
      console.error("알람 설정 오류:", error);
      // 더 자세한 오류 정보 출력
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const errorData = error.response?.data;
        addTestResult(`HTTP 상태 코드: ${statusCode}`);
        addTestResult(`오류 응답: ${JSON.stringify(errorData)}`);
      }
      
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
      addTestResult(`알람 설정 오류: ${errorMessage}`);
      toast.error(`알람 설정 실패: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 트리거 시간 계산 함수
  const calculateTriggerTime = (appointmentTime: Date, alertOption: string): Date => {
    const triggerTime = new Date(appointmentTime);
    
    switch (alertOption) {
      case "10분 전": 
        triggerTime.setMinutes(triggerTime.getMinutes() - 10);
        break;
      case "30분 전": 
        triggerTime.setMinutes(triggerTime.getMinutes() - 30);
        break;
      case "1시간 전": 
        triggerTime.setHours(triggerTime.getHours() - 1);
        break;
      case "1일 전": 
        triggerTime.setDate(triggerTime.getDate() - 1);
        break;
      default:
        // 테스트 알림이나 기타 옵션은 10초 후로 설정
        triggerTime.setSeconds(triggerTime.getSeconds() - 10);
    }
    
    return triggerTime;
  };

  // 카운트다운 함수 - 브라우저 알림 제거 버전
  const startCountdown = (seconds: number) => {
    let remaining = seconds;
    
    const countdownInterval = setInterval(() => {
      remaining--;
      
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        addTestResult(`⏰ 알림 시간이 되었습니다! 서버 알림이 발송되었는지 확인하세요.`);
      } else if (remaining <= 5) {
        // 5초 이하일 때만 카운트다운 표시
        addTestResult(`⏱️ 알림까지 ${remaining}초 남았습니다...`);
      }
    }, 1000);
  };

  // 테스트 결과 추가 함수
  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // 결과 초기화 함수
  const clearResults = () => {
    setTestResults([]);
  };

  // 알림 설정 삭제 함수 추가
  const cancelAlarmTest = async () => {
    if (!selectedRoom) {
      toast.error("채팅방을 먼저 선택해주세요");
      return;
    }
    
    try {
      setLoading(true);
      addTestResult("진행 중인 알림 테스트를 취소합니다...");
      
      // 현재 설정된 테스트 알림을 모두 찾아서 취소하는 로직
      // (이 부분은 서버에 별도의 API가 필요할 수 있음)
      
      toast.info("알림 테스트가 취소되었습니다");
      addTestResult("알림 테스트가 취소되었습니다");
    } catch (error) {
      console.error("알림 취소 오류:", error);
      toast.error("알림 취소 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  // API 경로 테스트 함수 구현
  const testApiPaths = async () => {
    if (!selectedRoom) {
      toast.error("채팅방을 먼저 선택해주세요");
      return;
    }

    try {
      setLoading(true);
      addTestResult("API 경로 테스트 시작...");
      
      // 서버 상태 확인
      const healthCheck = await axios.get("/api/health-check").catch(() => ({ status: 404 }));
      addTestResult(`서버 상태 확인: ${healthCheck.status === 200 ? '정상' : '응답 없음'}`);
      
      // 채팅방 정보 확인
      const chatRoomInfo = await axios.get(`/api/chat/${selectedRoom}`).catch(e => ({ status: e.response?.status || 500 }));
      addTestResult(`채팅방 정보 확인: ${chatRoomInfo.status === 200 ? '정상' : '오류 ' + chatRoomInfo.status}`);
      
      addTestResult("API 경로 테스트 완료");
      toast.success("API 경로 테스트 완료");
    } catch (error) {
      addTestResult("API 경로 테스트 중 오류 발생");
      console.error("API 테스트 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // 서버 알림 상태 확인 함수 개선
  const checkAlarmStatus = async (alarmId: number) => {
    try {
      setLoading(true);
      addTestResult(`알림 ID ${alarmId}의 상태를 확인합니다...`);
      
      const response = await axios.get(`/api/alarm-status/${alarmId}`);
      
      if (response.data.ok) {
        const alarm = response.data.alarm;
        const status = alarm.status;
        const statusInfo = alarm.statusInfo || '';
        
        // 상태에 따른 아이콘
        let statusIcon = '❓';
        switch (status) {
          case 'SCHEDULED': statusIcon = '⏳'; break;
          case 'TRIGGERED': statusIcon = '✅'; break;
          case 'DELIVERED': statusIcon = '📱'; break;
          case 'CANCELED': statusIcon = '❌'; break;
          case 'FAILED': statusIcon = '⚠️'; break;
          default: statusIcon = '❓';
        }
        
        addTestResult(`${statusIcon} 알림 상태: ${status} (${statusInfo})`);
        
        if (response.data.timeInfo) {
          const { formattedRemaining, direction, now, triggerAt } = response.data.timeInfo;
          const nowDate = new Date(now);
          const triggerDate = new Date(triggerAt);
          
          addTestResult(`🕐 현재 시간: ${nowDate.toLocaleTimeString()}`);
          addTestResult(`🔔 알림 예정 시간: ${triggerDate.toLocaleTimeString()}`);
          addTestResult(`⏱️ 알림 시간까지 ${formattedRemaining} ${direction}`);
        }
        
        // 디버그 정보 표시
        if (response.data.debug) {
          const debugInfo = response.data.debug;
          addTestResult(`📋 메타데이터: ${JSON.stringify(debugInfo).substring(0, 100)}...`);
        }
        
        // 상태가 여전히 SCHEDULED이고 트리거 시간이 지났다면 문제 가능성 표시
        if (status === 'SCHEDULED' && response.data.timeInfo?.isPast) {
          addTestResult(`⚠️ 알림 시간이 지났지만 아직 SCHEDULED 상태입니다. 서버 스케줄러에 문제가 있을 수 있습니다.`);
        }
        
        toast.info(`알림 상태: ${status}`);
        return status; // 상태 반환
      } else {
        addTestResult(`알림 상태 확인 실패: ${response.data.error}`);
        toast.error(`알림 상태 확인 실패`);
        return null;
      }
    } catch (error) {
      console.error("알림 상태 확인 오류:", error);
      addTestResult(`알림 상태 확인 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // 알림 상태 모니터링 함수
  const startMonitoring = (alarmId: number) => {
    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current);
    }
    
    setMonitorActive(true);
    addTestResult(`알림 ID ${alarmId}에 대한 자동 모니터링을 시작합니다 (30초 간격)`);
    
    // 즉시 한 번 확인
    checkAlarmStatus(alarmId);
    
    // 30초마다 상태 확인
    monitorIntervalRef.current = setInterval(async () => {
      if (!loading) {
        const status = await checkAlarmStatus(alarmId);
        
        // 알림이 발송되었거나 취소/실패했다면 모니터링 중지
        if (status && ['TRIGGERED', 'DELIVERED', 'CANCELED', 'FAILED'].includes(status)) {
          addTestResult(`알림 상태가 ${status}로 변경되어 모니터링을 중지합니다.`);
          stopMonitoring();
        }
      }
    }, 30000);
  };
  
  // 모니터링 중지 함수
  const stopMonitoring = () => {
    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }
    setMonitorActive(false);
    addTestResult(`알림 모니터링을 중지했습니다.`);
  };
  
  // 컴포넌트 언마운트 시 모니터링 정리
  useEffect(() => {
    return () => {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
      }
    };
  }, []);
  
  // 수동으로 알림 트리거 함수 (테스트 목적)
  const triggerAlarmManually = async (alarmId: number) => {
    try {
      setLoading(true);
      addTestResult(`알림 ID ${alarmId}를 수동으로 트리거합니다...`);
      
      // 수동 트리거 API 호출
      const response = await axios.post(`/api/alarm/trigger/test/d}`);
      
      if (response.data.ok) {
        const { alarm, pushResult } = response.data;
        
        addTestResult(`✅ 수동 트리거 성공!`);
        addTestResult(`   - 알림 ID: ${alarm.id}`);
        addTestResult(`   - 새 상태: ${alarm.status}`);
        addTestResult(`   - 트리거 시간: ${new Date(alarm.triggerTime).toLocaleString()}`);
        addTestResult(`   - 채팅방 ID: ${alarm.chatRoomId}`);
        
        if (pushResult.sent) {
          addTestResult(`📱 푸시 알림 전송 성공 (${pushResult.count}개 기기)`);
          toast.success(`알림이 수동으로 트리거되어 푸시 알림이 전송되었습니다!`);
        } else {
          addTestResult(`⚠️ 푸시 알림 전송 실패: ${pushResult.reason || '알 수 없는 이유'}`);
          toast.warning(`수동 트리거는 성공했지만 푸시 알림 전송에 실패했습니다: ${pushResult.reason}`);
        }
        
        // 트리거 후 상태 다시 확인
        setTimeout(() => {
          if (autoMonitorAlarmId === alarmId) {
            checkAlarmStatus(alarmId);
          }
        }, 1000);
        
      } else {
        addTestResult(`❌ 수동 트리거 실패: ${response.data.error}`);
        toast.error(`수동 트리거 실패: ${response.data.error}`);
      }
      
    } catch (error) {
      console.error("알림 수동 트리거 오류:", error);
      
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const errorData = error.response?.data;
        
        addTestResult(`❌ HTTP ${statusCode}: ${errorData?.error || error.message}`);
        
        if (statusCode === 404) {
          toast.error("알림을 찾을 수 없습니다. 알림 ID를 확인해주세요.");
        } else if (statusCode === 403) {
          toast.error("이 알림을 트리거할 권한이 없습니다.");
        } else if (statusCode === 400) {
          toast.error(errorData?.error || "잘못된 요청입니다.");
        } else {
          toast.error("서버 오류가 발생했습니다.");
        }
      } else {
        addTestResult(`❌ 알림 수동 트리거 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
        toast.error("알림 트리거 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout seoTitle="알림 테스트" title="알림 테스트" canGoBack>
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-800">알림 기능 테스트</h2>
        <p className="mt-2 text-sm text-gray-600">
          약속 알림이 서버에서 정상적으로 발송되는지 테스트합니다.
        </p>

        <div className="mt-6 space-y-4">
          {/* 직접 채팅방 ID 입력 */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              테스트할 채팅방 ID 직접 입력
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={customRoomId}
                onChange={e => setCustomRoomId(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md"
                placeholder="채팅방 ID 입력"
                disabled={loading}
              />
              <button
                onClick={applyCustomRoomId}
                disabled={loading || !customRoomId.trim()}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  loading || !customRoomId.trim()
                    ? "bg-gray-400"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                적용
              </button>
            </div>
          </div>

          {/* 채팅방 선택 드롭다운 */}
          {chatRoomsData?.ok && chatRoomsData.sellerChatRoomList.length > 0 && (
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                채팅방 목록에서 선택
              </label>
              <select
                value={selectedRoom || ""}
                onChange={e => setSelectedRoom(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={loading}
              >
                <option value="">채팅방을 선택하세요</option>
                {chatRoomsData.sellerChatRoomList.map(room => (
                  <option key={room.id} value={room.id}>
                    채팅방 {room.id} - {room.product?.name || '상품명 없음'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 현재 선택된 채팅방 표시 */}
          {selectedRoom && (
            <div className="p-3 text-blue-700 rounded-md bg-blue-50">
              <span className="font-medium">현재 선택된 채팅방 ID: {selectedRoom}</span>
            </div>
          )}

          {/* 테스트 모드 선택 */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="mb-3 font-medium">테스트 모드 선택</div>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="quick"
                  checked={testMode === 'quick'}
                  onChange={() => setTestMode('quick')}
                  className="mr-2"
                />
                <span>빠른 테스트 (몇 초 후)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="real"
                  checked={testMode === 'real'}
                  onChange={() => setTestMode('real')}
                  className="mr-2"
                />
                <span>실제 약속 테스트</span>
              </label>
            </div>
          </div>

          {/* 빠른 테스트 설정 */}
          {testMode === 'quick' && (
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                알림 트리거 시간 (초 후)
              </label>
              <input
                type="number"
                min="5"
                max="30"
                value={timeOffset}
                onChange={e => setTimeOffset(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                현재 시간으로부터 몇 초 후에 알림이 울릴지 설정합니다 (5-30초)
              </p>
            </div>
          )}

          {/* 실제 약속 테스트 설정 */}
          {testMode === 'real' && (
            <div className="p-4 space-y-3 border border-gray-200 rounded-lg">
              <div className="font-medium">실제 약속 설정</div>
              
              {/* 날짜 선택 */}
              <div>
                <label className="block mb-1 text-sm text-gray-700">약속 날짜</label>
                <input
                  type="date"
                  value={realAppointmentDate}
                  onChange={e => setRealAppointmentDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={loading}
                />
              </div>
              
              {/* 시간 선택 */}
              <div>
                <label className="block mb-1 text-sm text-gray-700">약속 시간</label>
                <input
                  type="time"
                  value={realAppointmentTime}
                  onChange={e => setRealAppointmentTime(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={loading}
                />
              </div>
              
              {/* 알림 옵션 */}
              <div>
                <label className="block mb-1 text-sm text-gray-700">알림 옵션</label>
                <select
                  value={realAlertOption}
                  onChange={e => setRealAlertOption(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={loading}
                >
                  <option value="10분 전">10분 전</option>
                  <option value="30분 전">30분 전</option>
                  <option value="1시간 전">1시간 전</option>
                  <option value="1일 전">1일 전</option>
                </select>
              </div>

              {/* 주의 문구 추가 */}
              <div className="p-3 mt-2 text-sm text-yellow-800 border border-yellow-200 rounded-md bg-yellow-50">
                <p className="font-medium">❗ 실제 약속 테스트 주의사항</p>
                <ul className="mt-1 ml-4 list-disc">
                  <li>정확한 테스트를 위해 약속 시간을 현재보다 2-3분 뒤로 설정하세요</li>
                  <li>서버에서 알림이 발송되면 앱에서 확인할 수 있습니다</li>
                  <li>알림 ID를 기록해두고 상태 확인 기능으로 서버 알림 상태를 확인하세요</li>
                </ul>
              </div>
            </div>
          )}

          {/* 테스트 실행 버튼 */}
          <div className="mt-2">
            <button
              onClick={testAlarmSettings}
              disabled={loading || !selectedRoom || (testMode === 'real' && (!realAppointmentDate || !realAppointmentTime))}
              className={`w-full py-4 font-medium text-white rounded-md ${
                loading || !selectedRoom || (testMode === 'real' && (!realAppointmentDate || !realAppointmentTime))
                  ? "bg-gray-400"
                  : "bg-red-500 hover:bg-red-600"
              } transition-all duration-200 shadow-md hover:shadow-lg`}
            >
              {loading ? 
                "처리 중..." : 
                testMode === 'quick' 
                  ? `🔔 ${timeOffset}초 후 알림 테스트 실행` 
                  : `🔔 실제 약속 알림 테스트 실행`
              }
            </button>
            <p className="mt-2 text-sm text-center text-gray-500">
              {testMode === 'quick' 
                ? "빠른 테스트: 가상 약속 생성 후 바로 알림을 확인합니다" 
                : "실제 테스트: 실제 약속과 동일한 방식으로 알림을 설정합니다"}
            </p>
          </div>

          {/* 취소 버튼 추가 */}
          <button
            onClick={cancelAlarmTest}
            disabled={loading || !selectedRoom}
            className={`w-full py-2 font-medium text-white rounded-md ${
              loading || !selectedRoom
                ? "bg-gray-400"
                : "bg-yellow-500 hover:bg-yellow-600"
            }`}
          >
            진행 중인 알림 테스트 취소
          </button>

          {/* API 경로 테스트 버튼 */}
          <button
            onClick={testApiPaths}
            disabled={loading || !selectedRoom}
            className={`w-full py-2 font-medium text-white rounded-md ${
              loading || !selectedRoom
                ? "bg-gray-400"
                : "bg-indigo-500 hover:bg-indigo-600"
            }`}
          >
            API 경로 테스트
          </button>
        </div>

        {/* 테스트 결과 */}
        {testResults.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-700 text-md">테스트 결과 로그</h3>
              <button
                onClick={clearResults}
                className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                결과 초기화
              </button>
            </div>
            <div className="p-4 overflow-auto text-sm text-gray-800 border border-gray-200 rounded-md bg-gray-50 h-96">
              {testResults.map((result, i) => (
                <div key={i} className={`py-1 border-b border-gray-100 last:border-0 ${
                  result.includes('⏰') ? 'text-red-600 font-bold' : 
                  result.includes('⏱️') ? 'text-orange-600' : 
                  result.includes('🔔') ? 'text-blue-600' : ''
                }`}>
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 알림 상태 확인 필드 */}
        <div className="p-4 mt-4 border border-gray-200 rounded-lg">
          <div className="mb-2 font-medium">서버 알림 상태 확인</div>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              className="flex-1 p-2 border border-gray-300 rounded-md"
              placeholder="알림 ID 입력"
              defaultValue={autoMonitorAlarmId || ''}
              onChange={(e) => {
                const id = parseInt(e.target.value);
                if (!isNaN(id) && id > 0) {
                  setAutoMonitorAlarmId(id);
                }
              }}
              disabled={loading || monitorActive}
            />
            <button
              onClick={() => {
                if (autoMonitorAlarmId) {
                  checkAlarmStatus(autoMonitorAlarmId);
                } else {
                  toast.error('유효한 알림 ID를 입력하세요');
                }
              }}
              disabled={loading || !autoMonitorAlarmId}
              className="px-3 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600"
            >
              상태 확인
            </button>
          </div>
          
          {/* 자동 모니터링 및 수동 트리거 버튼 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (monitorActive) {
                  stopMonitoring();
                } else if (autoMonitorAlarmId) {
                  startMonitoring(autoMonitorAlarmId);
                } else {
                  toast.error('유효한 알림 ID를 입력하세요');
                }
              }}
              disabled={loading || !autoMonitorAlarmId}
              className={`flex-1 py-2 text-sm font-medium text-white rounded-md ${
                loading || !autoMonitorAlarmId
                  ? "bg-gray-400"
                  : monitorActive
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {monitorActive ? '모니터링 중지' : '자동 모니터링 시작'}
            </button>
            
            <button
              onClick={() => {
                if (autoMonitorAlarmId) {
                  triggerAlarmManually(autoMonitorAlarmId);
                } else {
                  toast.error('유효한 알림 ID를 입력하세요');
                }
              }}
              disabled={loading || !autoMonitorAlarmId}
              className={`flex-1 py-2 text-sm font-medium text-white rounded-md ${
                loading || !autoMonitorAlarmId
                  ? "bg-gray-400"
                  : "bg-purple-500 hover:bg-purple-600"
              }`}
            >
              {loading ? '트리거 중...' : '수동 트리거 실행'}
            </button>
          </div>
          
          <div className="p-3 mt-3 text-sm text-blue-700 border border-blue-200 rounded-md bg-blue-50">
            <p className="font-medium">📌 알림 상태 정보</p>
            <ul className="mt-1 ml-4 list-disc">
              <li><strong>SCHEDULED</strong>: 알림이 예약되었지만 아직 발송되지 않음</li>
              <li><strong>SENT</strong>: 서버에서 알림을 발송함 (수동/자동)</li>
              <li><strong>DELIVERED</strong>: 클라이언트가 알림을 수신함</li>
              <li>SCHEDULED 상태의 알림만 수동 트리거가 가능합니다</li>
              <li>수동 트리거 시 즉시 푸시 알림이 전송됩니다</li>
            </ul>
          </div>
        </div>
        
        {/* 서버 스케줄러 진단 정보 */}
        <div className="p-4 mt-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
          <p className="font-medium">⚠️ 서버 알림이 작동하지 않는 경우</p>
          <ul className="mt-1 ml-4 list-disc">
            <li>알림 ID가 여전히 SCHEDULED 상태라면 서버 스케줄러에 문제가 있습니다</li>
            <li>서버 재시작 후 스케줄러가 초기화되었을 가능성이 있습니다</li>
            <li>알림 처리를 위한 실시간 연결(WebSocket 등)이 구현되어 있지 않을 수 있습니다</li>
            <li>서버 로그를 확인하여 알림 스케줄러의 작동 여부를 확인하세요</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default AlarmTest;
