export type InputMode = "clock" | "keyboard"; // 시계 UI로 입력 vs 키보드로 직접 입력
export type EditMode = "hour" | "minute"; // 시간 선택 vs 분 선택

export interface TimeValue {
  hour: number;
  minute: number;
}