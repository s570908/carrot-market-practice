import aclient from "./aclient";


interface TriggerAlarmParams {
  baseUrl: string;
  alarmId: number;
}

// 새로운 함수 - URL 라우트 방식 (URL 경로에 id 포함)
export async function triggerAlarmById(params: TriggerAlarmParams) {
  const { baseUrl, alarmId } = params;
  const response = await aclient.post(`${baseUrl}/api/alarm/trigger/${alarmId}`);
  return response.data;
}

