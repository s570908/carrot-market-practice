// datetime-local input 필드용 날짜 포맷 함수
export function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// 사용 예제들
export function getDateTimeExamples() {
  const now = new Date();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const meetupTime = new Date('2024-12-25T14:30:00');
  
  return {
    현재시간: formatDateTimeLocal(now),           // "2024-01-15T09:30"
    내일같은시간: formatDateTimeLocal(tomorrow),     // "2024-01-16T09:30"
    약속시간: formatDateTimeLocal(meetupTime),      // "2024-12-25T14:30"
  };
}

/* // 패턴 1: 현재 시간 + N분 후
const laterTime = new Date(Date.now() + 30 * 60 * 1000);
const formatted = formatDateTimeLocal(laterTime); // "2024-01-15T10:30"

// 패턴 2: 기존 약속 시간 편집
const existingTime = new Date(appointment.appointmentTime);
const editValue = formatDateTimeLocal(existingTime);

// 패턴 3: 시간 비교
const now = formatDateTimeLocal(new Date());
const selected = formatDateTimeLocal(selectedDate);
const isPast = selected < now; */