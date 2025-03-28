# useIntersectionObserver hook

https://usehooks-ts.com/react-hook/use-intersection-observer

# Why This Error Occurred

- Next.js 13버전이 나오면서, Link 태그는`<a>`로 렌더링 되므로 `<a>`를 사용하는 시도는 유효하지 않다고 하네요!

- How to solve the problem: <br />
  npx @next/codemod new-link .

# how to remove firefox's Default Dropdown for input html

https://stackoverflow.com/questions/71296535/how-to-remove-arrow-on-input-type-number-with-tailwind-css

# How to Remove Arrow on Input type Number with Tailwind CSS

https://stackoverflow.com/questions/71296535/how-to-remove-arrow-on-input-type-number-with-tailwind-css

# Data Fetching에 대해 알아보기 (3) - ISR

https://jforj.tistory.com/m/314

# NextJS와 ISR

https://velog.io/@seungchan__y/NextJS%EC%99%80-ISR

1. /libs/server/db.json에 update 혹은 create 가 발생하였고 이것을 알게된 webhook 이나 알림서비스가 POST request를 /api/revalidate-book 에 보낸다

2. 즉,....

```js
POST http://localhost:3000/api/revalidate-books?secret=nalnari
Content-Type: application/json

{
  "id": "9"
}
```

3. /api/revalidate-book 핸들러는 authentication을 수행하여 정당한 request인가를 확인한 후에 ISR을 수행하여서 cache를 업데이트한다.

<hr style="height:3px;border-width:0;color:gray;background-color:gray">

# SSR+SWR by hyunseo 에 대한 결과 관찰

"홈을 들어가면 좋아요가 0 -> DB값 으로 바뀌는 것을 확인할 수 있었습니다.": 그러나 SSR에서는 바뀌지 않는다. 그 이유는 홈으로 들어갈 때마다 즉, "/"로 요청될 때마다
SSR이 일어나고 api/products가 수행되고 fav는 불러오지 않고 따라서 "좋아요"는 항상 0이다. SSR을 SSG로 변경하면 될 것 같다.

# Next JS Upload File / Images to Local Directory

https://www.youtube.com/watch?app=desktop&v=QTD9L0jL0dU

Tofik Nuryanto
6 months ago
but the images cannot accessed on production mode

3

Reply

3 replies
Bachar El karni
Bachar El karni
6 months ago
Is there an alternative to this cuz i'm facing this exact prob

Reply

Tofik Nuryanto
Tofik Nuryanto
6 months ago (edited)
Absolutely you need 1 step to access your image after image uploaded.

1. Re build your app, so image will detected 😁 or ...
2. Create an API to serve your image.

Example:
Create api file usual /pages/api/images/[filename].jsx
import fs
read data file using query filename
Send the image to client
😁
Show less

2

Reply

Bachar El karni
Bachar El karni
6 months ago
@Tofik Nuryanto thanks

Reply

# Tmapv2 event type

- event 동작이 안될 경우 브라우져의 extension 과의 충돌이 있을 수 있으므로, 그 경우에는 incognito 브라우져에서 앱을 수행시켜야 한다.

  bounds_changed,
  center_changed,
  click,
  dblclick,
  drag,
  dragend,
  dragstart,
  zoom_changed,
  mouseenter,
  mouseleave,
  mousedown,
  mousemove,
  mouseup,
  mousewheel,
  touchstart,
  touchmove,
  touchend,
  touchcancel,
  keydown,
  keyup,
  contextmenu,
  resize

<hr style="height:3px;border-width:0;color:gray;background-color:gray">

# 판매자가 상품 상태를 변경했을 때,

사용자가 필터 옵션(RadioButtonGroup)을 클릭하면 최신 데이터를 가져와 변경된 상태를 반영하도록 하는 기능

## 구현

1. 제품 상태 변경 이벤트(changeState)를 추적하는 상태 변수를 추가
2. handleOptionChange 함수를 수정하여:
   - 값이 변경되었을 때
   - changeState 이벤트가 발생했었다면
   - refetchChats를 실행하고
   - changeState 이벤트 기록을 초기화

## 작동 흐름

1. hasStateChanged 상태 변수를 추가하여 상품 상태 변경 이벤트를 추적합니다.
2. 소켓에 changeState 이벤트 리스너를 추가하여 상태 변경 시 hasStateChanged를 true로 설정합니다.
3. 사용자가 RadioButtonGroup에서 옵션을 변경하면:
   - 선택된 값이 실제로 변경되었는지 확인합니다.
   - hasStateChanged가 true이면 refetchChats를 호출하고 hasStateChanged를 false로 재설정합니다.

<hr style="height:3px;border-width:0;color:gray;background-color:gray">

# 약속잡기 TypeScript 인터페이스 정의

약속잡기 기능을 위한 TypeScript 인터페이스와 샘플 객체입니다. 이 인터페이스는 TMap API와 통합하여 위치 정보를 관리하고 약속 일정을 체계적으로 구성합니다.

## 기본 타입 정의

```typescript
// 열거형 정의
enum ParticipantStatus {
  CONFIRMED = "confirmed",
  PENDING = "pending",
  DECLINED = "declined",
}

enum NotificationType {
  EMAIL = "email",
  PUSH = "push",
  SMS = "sms",
}

enum AppointmentStatus {
  SCHEDULED = "scheduled",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

enum RecurrenceFrequency {
  NONE = "none",
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
}

// 날짜/시간 인터페이스
interface DateTimeInfo {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  timezone: string; // 예: Asia/Seoul
}

// 위치 정보 인터페이스
interface LocationInfo {
  name: string;
  address: string;
  fullAddressRoad: string;
  latitude: number;
  longitude: number;
  zoomLevel: number;
}

// 주최자/참석자 인터페이스
interface Person {
  id: string;
  name: string;
  profileImage: string;
}

// 참석자 인터페이스 (Person 확장)
interface Attendee extends Person {
  status: ParticipantStatus;
  responseTime: string | null;
}

// 참가자 그룹 인터페이스
interface ParticipantsInfo {
  organizer: Person;
  attendees: Attendee[];
}

// 알림 인터페이스
interface Notification {
  type: NotificationType;
  time: number; // 약속 전 알림 시간 (분 단위)
}

// 추가 설정 인터페이스
interface AppointmentSettings {
  isPrivate: boolean;
  allowReschedule: boolean;
  maxAttendees: number;
}

// 반복 설정 인터페이스
interface RecurrenceInfo {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate: string | null;
}

// 메인 약속 인터페이스
interface Appointment {
  id: string;
  title: string;
  description: string;
  datetime: DateTimeInfo;
  location: LocationInfo;
  participants: ParticipantsInfo;
  notifications: Notification[];
  status: AppointmentStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  settings: AppointmentSettings;
  recurrence: RecurrenceInfo;
}
```

## 샘플 객체 인스턴스

```typescript
// 샘플 약속 객체 생성
const sampleAppointment: Appointment = {
  id: "app-12345",
  title: "프로젝트 회의",
  description: "프로젝트 진행 상황 점검 및 향후 계획 논의",

  datetime: {
    date: "2025-04-01",
    startTime: "14:00",
    endTime: "16:00",
    timezone: "Asia/Seoul",
  },

  location: {
    name: "스타벅스 강남역점",
    address: "서울특별시 강남구 강남대로 396",
    fullAddressRoad: "서울특별시 강남구 강남대로 396 강남역 지하 1층",
    latitude: 37.498095,
    longitude: 127.02761,
    zoomLevel: 17,
  },

  participants: {
    organizer: {
      id: "user-789",
      name: "김철수",
      profileImage: "/profiles/user789.jpg",
    },
    attendees: [
      {
        id: "user-123",
        name: "이영희",
        profileImage: "/profiles/user123.jpg",
        status: ParticipantStatus.CONFIRMED,
        responseTime: "2025-03-25T10:30:00+09:00",
      },
      {
        id: "user-456",
        name: "박민수",
        profileImage: "/profiles/user456.jpg",
        status: ParticipantStatus.PENDING,
        responseTime: null,
      },
    ],
  },

  notifications: [
    {
      type: NotificationType.PUSH,
      time: 60, // 60분 전 알림
    },
    {
      type: NotificationType.EMAIL,
      time: 1440, // 24시간 전 알림
    },
  ],

  status: AppointmentStatus.SCHEDULED,
  createdAt: "2025-03-20T15:30:00+09:00",
  updatedAt: "2025-03-20T15:30:00+09:00",

  settings: {
    isPrivate: false,
    allowReschedule: true,
    maxAttendees: 5,
  },

  recurrence: {
    frequency: RecurrenceFrequency.NONE,
    interval: 0,
    endDate: null,
  },
};
```

# MapModal 컴포넌트에서 주소 검색 항목 클릭 시 처리 과정

MapModal 컴포넌트의 주소 검색 결과 항목을 클릭했을 때 발생하는 데이터 흐름과 처리 과정을 단계별로 정리하겠습니다.

## 주소 검색 항목 클릭 과정 흐름도

검색 항목 클릭 → 좌표 추출 → 마커 업데이트 → 좌표 상태 업데이트 → 주소 정보 API 요청 → 주소 정보 표시

## 상세 단계별 설명

1. 검색 항목 클릭 및 이벤트 핸들러 실행
   사용자가 검색 결과 목록(`<li>` 요소)을 클릭하면 onClick={onClickAddressListItem} 이벤트 핸들러가 호출됩니다.

```tsx
<li
  role="option"
  aria-selected={false}
  className="cursor-pointer rounded border p-2 hover:bg-gray-100"
  key={address.pkey}
  value={`${fullAddress} ${addressName}`}
  data-lat={lat} // 위도 데이터를 HTML 속성으로 저장
  data-lon={lon} // 경도 데이터를 HTML 속성으로 저장
  onClick={onClickAddressListItem}
>
  <span className="block text-sm font-bold">{addressName}</span>
  <span className="block text-xs font-normal">{fullAddress}</span>
</li>
```

2. 좌표 추출 및 마커 업데이트 요청
   onClickAddressListItem 함수에서는 클릭된 요소로부터 위도/경도 값을 추출하여 마커 업데이트를 요청합니다:

```tsx
const onClickAddressListItem = <Event extends React.MouseEvent | React.KeyboardEvent>(e: Event) => {
  const coordinate = {
    latitude: Number(e.currentTarget.getAttribute("data-lat")), // 위도 추출
    longitude: Number(e.currentTarget.getAttribute("data-lon")), // 경도 추출
  };

  // 마커 업데이트 함수 호출 (빨간색 마커로 표시)
  updateMarker(coordinate, "red");

  // 마커 업데이트 플래그 설정 (중복 렌더링 방지)
  isMarkerUpdated.current = true;
};
```

3. 마커 업데이트 및 좌표 상태 변경
   updateMarker 함수 내부에서는 다음과 같은 작업이 이루어집니다:

```tsx
const updateMarker = useCallback(
  (
    coord: { latitude: number | null; longitude: number | null },
    theme: "green" | "red" = "green"
  ) => {
    const { latitude, longitude } = coord;
    if (!(latitude && longitude) || !mapInstance || !TmapRef.current) {
      return;
    }

    // 같은 좌표면 중심만 이동 (무한 렌더링 방지)
    if (
      lastCoordRef.current &&
      lastCoordRef.current.latitude === latitude &&
      lastCoordRef.current.longitude === longitude
    ) {
      const Tmapv2 = TmapRef.current;
      mapInstance.setCenter(new Tmapv2.LatLng(latitude, longitude));
      return;
    }

    // 새 좌표 저장 (중복 렌더링 방지)
    lastCoordRef.current = { latitude, longitude };

    // 새 마커 생성 (makeMarker 함수가 기존 마커를 제거함)
    const Tmapv2 = TmapRef.current;
    const position = new Tmapv2.LatLng(latitude, longitude);

    const marker = makeMarker(position, theme);
    if (!marker) {
      console.error("마커 업데이트 실패");
      return;
    }

    // 좌표 상태 업데이트 - 이 부분이 중요!
    setCurrentCoord(position);
    lastZoomCenterRef.current = {
      lat: position.lat(),
      lng: position.lng(),
    };

    // 지도 중심 이동
    mapInstance.setCenter(position);
  },
  [mapInstance, makeMarker]
);
```

4. 좌표 상태 변경에 따른 주소 정보 요청
   setCurrentCoord(position) 호출로 인해 currentCoord 상태가 변경되면, useQuery에서 의존성으로 추적하고 있는 coord 객체도 변경됩니다:

```tsx
const coord = {
  latitude: currentCoord?.lat() || 0,
  longitude: currentCoord?.lng() || 0,
};

// currentCoord가 변경되면 주소 요청 API가 자동으로 재실행됨
const { data: addressData } = useQuery({
  ...queryKeys.tmap.getAddressFromCoord({
    latitude: coord.latitude,
    longitude: coord.longitude,
  }),
  placeholderData: keepPreviousData,
  enabled: !!coord.latitude && !!coord.longitude, // 유효한 좌표가 있을 때만 요청 활성화
  staleTime: 3000, // 캐시 유지 시간 30초
});

// API 응답 데이터에서 주소 정보 추출
const currentAddress = addressData?.addressInfo?.fullAddress || "";
```

5. UI에 정보 표시
   얻어진 currentAddress 값(별칭: selectedAddress)이 UI에 표시됩니다:

```tsx
<div className="flex items-center justify-center space-x-2">
  <span className="text-sm font-normal">선택한 주소: </span>
  <span className="text-sm font-bold">{selectedAddress}</span>
</div>
```

## 데이터 흐름 요약

1. 사용자 입력: 사용자가 검색 결과 항목을 클릭
2. 이벤트 처리: onClickAddressListItem 함수 실행
3. 좌표 데이터: 클릭한 항목의 위도/경도 추출
4. 마커 처리: updateMarker 함수로 지도에 마커 표시
5. 상태 업데이트: setCurrentCoord로 현재 좌표 상태 변경
6. API 요청: useQuery를 통해 좌표→주소 변환 API 호출
7. UI 반영: 받아온 주소 정보를 selectedAddress로 화면에 표시

- [useIntersectionObserver hook](#useintersectionobserver-hook)
- [Why This Error Occurred](#why-this-error-occurred)
- [how to remove firefox's Default Dropdown for input html](#how-to-remove-firefoxs-default-dropdown-for-input-html)
- [How to Remove Arrow on Input type Number with Tailwind CSS](#how-to-remove-arrow-on-input-type-number-with-tailwind-css)
- [Data Fetching에 대해 알아보기 (3) - ISR](#data-fetching에-대해-알아보기-3---isr)
- [NextJS와 ISR](#nextjs와-isr)
- [SSR+SWR by hyunseo 에 대한 결과 관찰](#ssrswr-by-hyunseo-에-대한-결과-관찰)
- [Next JS Upload File / Images to Local Directory](#next-js-upload-file--images-to-local-directory)
- [Tmapv2 event type](#tmapv2-event-type)
- [판매자가 상품 상태를 변경했을 때,](#판매자가-상품-상태를-변경했을-때)
  - [구현](#구현)
  - [작동 흐름](#작동-흐름)
- [약속잡기 TypeScript 인터페이스 정의](#약속잡기-typescript-인터페이스-정의)
  - [기본 타입 정의](#기본-타입-정의)
  - [샘플 객체 인스턴스](#샘플-객체-인스턴스)
- [MapModal 컴포넌트에서 주소 검색 항목 클릭 시 처리 과정](#mapmodal-컴포넌트에서-주소-검색-항목-클릭-시-처리-과정)
  - [주소 검색 항목 클릭 과정 흐름도](#주소-검색-항목-클릭-과정-흐름도)
  - [상세 단계별 설명](#상세-단계별-설명)
  - [데이터 흐름 요약](#데이터-흐름-요약)
