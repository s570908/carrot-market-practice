import aclient from "./aclient";


interface TriggerAlarmParams {
  baseUrl: string;
  alarmId: number;
}

export async function triggerAlarm(params: TriggerAlarmParams) {
  const { baseUrl, alarmId } = params;
  const response = await aclient.post(`${baseUrl}/api/alarm/trigger`, {
    alarmId
  });
  return response.data;
}