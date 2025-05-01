import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ko"; // 한국어 로케일 추가
import { useRouter } from "next/router";
import Layout from "@components/Layout";
import Link from "next/link";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import koLocale from "@fullcalendar/core/locales/ko";
import { AppointmentStatus } from "@prisma/client";
import ModButton from "@/components/ModButton";
import { useQuery } from "@tanstack/react-query";
import { getAppointments } from "@/apiLibs/appointments";
import { FullCalendarEvent, statusColors, statusText } from "@/types";
import { AppointmentForCalendarEvent } from "@/types"; // 타입 정의 가져오기
import { formatAppointmentsForAll } from "@libs/utils";
import AppointmentStatusBadge from "@components/appointments/AppointmentStatusBadge"; // 새로운 컴포넌트 import

// 정적 테스트 이벤트 10개 생성 - 컴포넌트 외부로 이동
const testEvents = [
  // 오늘
  {
    id: "1",
    title: "테스트 약속 1",
    start: "2025-04-12T19:00:00",
    end: "2025-04-12T21:30:00",
    backgroundColor: statusColors.CONFIRMED,
    textColor: "white",
    allDay: false,
  },
];

// dayjs에 한국어 로케일 설정
dayjs.locale("ko");

export default function AppointmentCalendar() {
  const router = useRouter();
  const { view } = router.query; // URL에서 view 쿼리 파라미터 가져오기

  // 초기 뷰 설정: URL 쿼리에 뷰 정보가 있으면 사용, 없으면 기본값 dayGridMonth
  const [calendarView, setCalendarView] = useState(
    typeof view === "string" ? view : "dayGridMonth"
  );
  const calendarRef = useRef<any>(null);

  // 약속 목록 가져오기
  const tab = "all"; // 내가 만든 약속과 내가 참여한 약속 모두 가져오기
  const {
    data,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["appointments", tab],
    queryFn: () => getAppointments(tab),
    staleTime: 60000, // 1분 동안 캐시 데이터 유지 (필요에 따라 조정)
  });
  //console.log("AppointmentCalendar: data: ", data);

  const [events, setEvents] = useState<FullCalendarEvent[]>([]);

  // API 데이터와 정적 테스트 이벤트를 합쳐서 캘린더 이벤트로 설정
  useEffect(() => {
    if (data) {
      // organized와 participating 배열을 합침
      const allAppointments = [...data.organized, ...data.participating];
      // 중복 제거 (같은 약속이 두 배열에 모두 있을 수 있음)
      const uniqueAppointments = Array.from(
        new Map(allAppointments.map((item) => [item.id, item])).values()
      );

      const formattedEvents = formatAppointmentsForAll(uniqueAppointments);
      const combinedEvents = [...formattedEvents, ...testEvents];
      setEvents(combinedEvents);
    }
  }, [data]);

  // 캘린더가 마운트된 후 URL에 지정된 뷰로 변경
  useEffect(() => {
    if (calendarRef.current && view && typeof view === "string") {
      // 유효한 뷰 타입인지 확인
      const validViews = ["dayGridMonth", "timeGridWeek", "timeGridDay", "listWeek"];
      if (validViews.includes(view)) {
        // 상태 먼저 업데이트
        setCalendarView(view);

        // setTimeout으로 마이크로태스크 큐에 넣어 React 렌더링 사이클과 분리
        setTimeout(() => {
          if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.changeView(view);
          }
        }, 0);
      }
    }
  }, [calendarRef, view]);

  // 이벤트 클릭 시 현재 뷰 타입도 쿼리 파라미터로 전달
  const handleEventClick = (info: any) => {
    // 현재 뷰 타입을 확인
    const currentViewType = calendarRef.current?.getApi().view.type;

    // 다른 뷰에서는 상세 페이지로 이동 (from=calendar와 현재 뷰 타입 쿼리 파라미터 추가)
    router.push(`/appointments/${info.event.id}?from=calendar&view=${currentViewType}`);
  };

  // 날짜 클릭 시 반응 안함
  const handleDateClick = (info: any) => {
    console.log("handleDateClick: ", info.dateStr);
  };

  return (
    <Layout
      title="약속 캘린더"
      seoTitle="약속 캘린더 | Carrot Market"
      canGoBack
      backUrl="/appointments"
    >
      {/* 헤더를 fixed로 변경, 캘린더 영역에 padding-top 추가 */}
      <div className="flex h-full flex-col overflow-hidden">
        {/* 고정 헤더 */}
        <div
          className="fixed left-0 right-0 z-40 mx-auto max-w-xl bg-white"
          style={{ top: 48 /* Layout 헤더 높이(px) */ }}
        >
          <div className="flex items-center justify-between px-4 pb-2 pt-4">
            <h2 className="text-lg font-medium">약속 캘린더</h2>
            <div className="flex space-x-2">
              <Link href="/appointments/create" legacyBehavior passHref>
                <a className="block">
                  <ModButton variant="primary" size="small">
                    약속 만들기
                  </ModButton>
                </a>
              </Link>
            </div>
          </div>
          <div className="mx-4 mb-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <p className="mb-2 text-sm font-medium text-gray-500">약속 상태</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center text-sm">
                  <div
                    className="mr-1 h-3 w-3 rounded-full"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span>{statusText[status as AppointmentStatus]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* 캘린더 영역에 헤더 높이만큼 padding-top 추가 (ex: 140px) */}
        <div className="min-h-0 flex-1 overflow-auto p-4 pt-[140px]">
          <div className="h-full rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="calendar-container h-[calc(100vh-220px)] max-h-[800px] min-h-[500px] w-full bg-white lg:h-[650px]">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView={calendarView} // 초기 뷰를 상태 값으로 설정
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                }}
                dayHeaderContent={(args) => {
                  const day = dayjs(args.date).format("dd"); // 요일 (일, 월, 화 등)
                  const date = dayjs(args.date).format("D"); // 날짜 (6, 7, 8 등)
                  const month = dayjs(args.date).format("M"); // 월 (4, 5, 6 등)

                  const currentViewType = calendarRef.current?.getApi().view.type;

                  // 월별 뷰에서는 요일만 표시
                  if (currentViewType === "dayGridMonth") {
                    return (
                      <div className="text-center">
                        <div>{day}</div>
                      </div>
                    );
                  }

                  // 다른 뷰에서는 기존 형식 유지
                  if (currentViewType === "timeGridDay") {
                    return (
                      <div className="text-center">
                        <div>{day}</div>
                      </div>
                    );
                  }

                  if (currentViewType === "listWeek") {
                    return (
                      <div className="text-center">
                        <div>
                          {month}월 {date}일, {day}
                        </div>
                      </div>
                    );
                  }

                  // 주간 뷰에서는 요일과 날짜 모두 표시 (이건 의미가 있음)
                  return (
                    <div className="text-center">
                      <div>{day}</div>
                      <div>{date}</div>
                    </div>
                  );
                }}
                titleFormat={(date) => {
                  const currentViewType = calendarView;

                  if (currentViewType === "timeGridDay") {
                    return dayjs(date.date.marker).format("M월 D일");
                  }

                  return dayjs(date.date.marker).format("M월");
                }}
                buttonText={{
                  today: "오늘",
                  month: "월",
                  week: "주",
                  day: "일",
                  list: "일정목록",
                }}
                events={events.map((event) => ({
                  ...event,
                  start: new Date(event.start),
                  end: new Date(event.end),
                  allDay: false,
                }))}
                timeZone="local"
                eventDisplay="auto"
                displayEventTime={true}
                displayEventEnd={true}
                eventTimeFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                datesSet={(dateInfo) => {
                  setCalendarView(dateInfo.view.type);
                }}
                eventContent={(eventInfo) => {
                  const event = eventInfo.event;
                  const viewType = calendarRef.current?.getApi().view.type;

                  const startDay = dayjs(event.start).format("YYYY-MM-DD");
                  const endDay = dayjs(event.end).format("YYYY-MM-DD");

                  const isMultiDayEvent = startDay !== endDay;
                  const locationName = event.extendedProps?.locationTmap?.locationName;
                  const status = event.extendedProps?.status || "PENDING";

                  const containerClass = viewType.includes("dayGrid")
                    ? "event-content-month"
                    : viewType.includes("timeGrid")
                    ? "event-content-day"
                    : "event-content-list";

                  const multiDayClass = isMultiDayEvent ? "multi-day-event" : "";

                  // 일정목록 뷰에 대한 특별 처리
                  if (viewType === "listWeek") {
                    return (
                      <div className={`w-full ${containerClass} ${multiDayClass}`}>
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between">
                            <span className="event-title">{event.title}</span>
                            {/* 상태 배지 추가 */}
                            <div className="ml-2">
                              <AppointmentStatusBadge status={status} size="small" />
                            </div>
                          </div>
                          {locationName && (
                            <div className="location-text mt-1 text-gray-600">
                              <svg
                                className="mr-1 inline-block h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span className="text-xs">{locationName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // 월별 뷰 또는 주별 뷰
                  if (viewType === "dayGridMonth" || viewType === "timeGridWeek") {
                    // 상태별 배경색 적용 (단일 약속에만)
                    const eventBgColor =
                      !isMultiDayEvent && statusColors[status as AppointmentStatus]
                        ? statusColors[status as AppointmentStatus]
                        : undefined;

                    return (
                      <div
                        className={`w-full overflow-hidden p-1 ${containerClass} ${multiDayClass}`}
                        style={
                          eventBgColor
                            ? { backgroundColor: eventBgColor, color: "#fff", borderRadius: "4px" }
                            : undefined
                        }
                      >
                        <div className="event-title-month pl-2">{event.title}</div>
                      </div>
                    );
                  }

                  // 일별 뷰 등 기타 뷰
                  return (
                    <div
                      className={`w-full overflow-hidden p-1 ${containerClass} ${multiDayClass}`}
                    >
                      <div className="event-title">
                        {event.title}
                        {isMultiDayEvent && (
                          <span className="ml-1 text-xs font-normal">
                            ({dayjs(event.start).format("M/D")}~{dayjs(event.end).format("M/D")})
                          </span>
                        )}
                      </div>
                      <div className="event-time">
                        {dayjs(event.start).format("HH:mm")} - {dayjs(event.end).format("HH:mm")}
                      </div>
                      <div className="event-location">
                        {event.extendedProps?.location || "위치 미정"}
                      </div>
                    </div>
                  );
                }}
                eventDidMount={(info) => {
                  // 이벤트가 다일 약속인지 확인
                  const startDay = dayjs(info.event.start).format("YYYY-MM-DD");
                  const endDay = dayjs(info.event.end).format("YYYY-MM-DD");
                  const isMultiDayEvent = startDay !== endDay;

                  if (isMultiDayEvent) {
                    // 다일 약속인 경우 클래스 추가
                    info.el.classList.add("multi-day-event");

                    // 일정목록 뷰에서 시간 컬럼 변경
                    if (info.view.type === "listWeek") {
                      // 시간 컬럼 찾기
                      const timeCell = info.el.querySelector(".fc-list-event-time");
                      if (timeCell) {
                        // 기존 시간 텍스트 백업
                        const originalTimeText = timeCell.textContent || "";

                        // 새로운 내용으로 교체
                        timeCell.innerHTML = `
                          <div class="flex flex-col">
                            <div class="flex items-center text-blue-500 font-medium">
                              <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              기간 약속
                            </div>
                            <div class="text-xs mt-1">
                              ${dayjs(info.event.start).format("M/D")} ~ ${dayjs(
                          info.event.end
                        ).format("M/D")}
                            </div>
                          </div>
                        `;
                      }
                    }
                  }
                }}
                height="auto"
                locale={koLocale}
                allDaySlot={false}
                slotMinTime="00:00:00"
                slotMaxTime="24:00:00"
                slotDuration="00:30:00"
                nowIndicator={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                views={{
                  timeGrid: {
                    nowIndicator: true,
                    eventMinHeight: 20,
                  },
                  dayGridMonth: {
                    weekNumbers: false,
                  },
                  timeGridWeek: {
                    nowIndicator: true,
                    weekNumbers: true,
                    weekNumberCalculation: "ISO",
                    weekText: "주",
                  },
                  listWeek: {
                    listDayFormat: {
                      month: "numeric",
                      day: "numeric",
                    },
                    listDaySideFormat: {
                      weekday: "short",
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        /* Layout 헤더 관련 스타일 */
        div[data-rk] > div > div > div:first-child {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 50 !important;
          background-color: white !important;
          width: 100% !important;
          max-width: 36rem !important; /* xl의 max-w-xl 값 */
          margin: 0 auto !important;
          border-bottom: 1px solid #e5e7eb !important;
        }

        /* 고정 헤더 스타일 강화 */
        .fixed.left-0.right-0.z-40 {
          max-width: 36rem;
          margin-left: auto;
          margin-right: auto;
        }

        @media (max-width: 640px) {
          .fixed.left-0.right-0.z-40 {
            max-width: 100vw;
          }
        }

        /* FullCalendar 헤더 툴바 - 더 작게 조정 */
        .fc .fc-header-toolbar {
          position: fixed;
          top: 140px;
          left: 0;
          right: 0;
          z-index: 45;
          background-color: white;
          padding: 0 0 2px 0; /* 4px에서 2px로 더 축소 */
          margin-bottom: 0 !important;
          height: 36px; /* 40px에서 36px로 더 축소 */
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          max-width: 36rem;
          margin-left: auto;
          margin-right: auto;
        }

        /* 헤더 툴바 아래 여백 영역 더 축소 */
        .fc .fc-header-toolbar::after {
          content: "";
          position: fixed;
          top: 176px; /* 140px + 36px */
          left: 0;
          right: 0;
          height: 2px; /* 4px에서 2px로 축소 */
          background-color: white;
          z-index: 44;
          max-width: 36rem;
          margin-left: auto;
          margin-right: auto;
        }

        /* 캘린더 컨테이너 패딩 재조정 */
        .calendar-container {
          padding-top: 38px; /* 36px(툴바) + 2px(여백) */
        }

        /* 툴바 버튼 스타일(이전과 동일) */
        .fc-toolbar-chunk .fc-button {
          font-size: 11px;
          padding: 2px 5px;
          min-width: 35px;
          height: 24px;
          line-height: 1.2;
          background-color: #ffffff;
          color: #4285f4;
          border: 1px solid #4285f4;
          box-shadow: none;
          border-radius: 4px;
          margin-right: 4px;
          margin-left: 0;
          transition: background 0.15s, color 0.15s, border 0.15s;
        }
        .fc-toolbar-chunk .fc-button:last-child {
          margin-right: 0;
        }
        .fc-button-active {
          background-color: transparent !important;
          color: #4285f4 !important;
          border: 2px solid #4285f4 !important;
          font-weight: 600 !important;
        }
        .fc-button-primary:hover {
          background-color: rgba(66, 133, 244, 0.1) !important;
          color: #4285f4 !important;
          border-color: #4285f4 !important;
        }
        .fc-today-button {
          background-color: #4285f4 !important;
          color: white !important;
          border: 1px solid #4285f4 !important;
        }
        .fc-today-button.fc-button-active {
          background-color: #3367d6 !important;
          border-color: #3367d6 !important;
        }
        .fc-button-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .fc .fc-header-toolbar .fc-toolbar-chunk {
          display: flex;
          align-items: center;
        }

        /* 모바일 대응 재조정 */
        @media (max-width: 640px) {
          .fixed.left-0.right-0.z-40 {
            padding-top: 8px;
          }
          .fc .fc-header-toolbar {
            top: 148px;
            max-width: 100vw;
          }
          .fc .fc-header-toolbar::after {
            top: 184px; /* 148px + 36px */
            max-width: 100vw;
          }
        }
      `}</style>
    </Layout>
  );
}
