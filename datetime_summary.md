# 날짜와 시간: `Date`, `string`, `number`, `timestamp`, `ISO` 타입, `UTC vs Local Time` 정리

---

## ✅ 1. 핵심 용어 정리

| 용어         | 설명 |
|--------------|------|
| `Date`       | JS 내장 객체로, 날짜와 시간을 표현. 내부적으로 UTC timestamp(ms)로 저장됨 |
| `string`     | `"2025-05-26 14:00"` 같은 사람이 읽을 수 있는 텍스트 |
| `number`     | Unix timestamp. `1970-01-01 00:00:00 UTC`부터 밀리초(ms)나 초(sec) 단위 숫자 |
| `timestamp`  | 보통 Unix timestamp를 의미. 숫자 혹은 ISO 문자열로 표현 가능 |
| `ISO string` | `2025-05-26T14:00:00.000Z`처럼 날짜를 UTC 기준으로 표준 표현 |
| `UTC`        | 국제표준시. 세계 표준 시간대 (한국은 +9시간) |
| `Local Time` | 브라우저나 서버가 동작 중인 시스템의 현지 시간대에 따른 시간 |

---

## ✅ 2. 관계 예시

```js
const date = new Date("2025-05-26T14:00:00Z");
```

| 표현 | 결과 |
|------|------|
| `date.toString()` | `"Mon May 26 2025 23:00:00 GMT+0900"` (한국 시간 기준) |
| `date.toISOString()` | `"2025-05-26T14:00:00.000Z"` (UTC 기준) |
| `date.getTime()` | `1748268000000` (Unix timestamp in ms) |
| `date.getUTCHours()` | `14` |
| `date.getHours()` | `23` (Local 기준) |

---

## ✅ 3. Local vs UTC 차이 예시

```js
const localDate = new Date();

console.log(localDate.toString());      // Local Time
console.log(localDate.toISOString());   // UTC 기준
```

한국에서 실행하면 예를 들어:

```
localDate.toString()     // "Mon May 26 2025 23:00:00 GMT+0900"
localDate.toISOString()  // "2025-05-26T14:00:00.000Z"
```

---

## ✅ 4. 변환 요약표

| 변환 | 코드 예시 |
|------|-----------|
| Date → ISO string | `date.toISOString()` |
| Date → timestamp  | `date.getTime()` |
| timestamp → Date  | `new Date(1748268000000)` |
| string → Date     | `new Date("2025-05-26T14:00:00Z")` |
| ISO string → Local Time | `new Date("2025-05-26T14:00:00Z").toString()` |

---

## ✅ 5. 실전 예시: 알람 기능

DB에 저장된 알람 시간: `"2025-05-26T14:00:00.000Z"`  
서버가 한국(UTC+9)에서 실행 중인 경우:

```js
const alarm = new Date("2025-05-26T14:00:00.000Z");

console.log(alarm.toLocaleString());  // "2025. 5. 26. 오후 11:00"
console.log(alarm.toISOString());     // "2025-05-26T14:00:00.000Z"
```

---

## ✅ 6. 권장 사용 패턴

| 목적 | 추천 형식 | 이유 |
|------|-----------|------|
| DB 저장 | ISO (`.toISOString()`), timestamp | UTC 기준 저장이 글로벌하게 유리 |
| 프론트 표시 | `toLocaleString()` | 현지 시간대 기반 |
| 시간 비교, 예약 | `getTime()` | 숫자 기반 연산에 유리 |

---

## ✅ 7. `dayjs` 예제 (타임존 포함)

```js
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const utcTime = dayjs.utc("2025-05-26T14:00:00.000Z")
console.log(utcTime.tz("Asia/Seoul").format()) // "2025-05-26T23:00:00+09:00"
```
