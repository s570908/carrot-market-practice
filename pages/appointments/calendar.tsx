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
      const formattedEvents = formatAppointmentsForAll(data || []); // API 데이터 변환
      const combinedEvents = [...formattedEvents, ...testEvents]; // 정적 테스트 이벤트와 합침
      setEvents(combinedEvents); // 캘린더 이벤트 설정
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
      <div className="flex h-full flex-col p-4">
        {/* 헤더 영역: 제목 및 버튼 */}
        <div className="mb-4 flex items-center justify-between">
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

        {/* 상태 범례 - 상단에 카드로 분리 */}
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-sm font-medium text-gray-500">약속 상태</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center text-sm">
                <div className="mr-1 h-3 w-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span>{statusText[status as AppointmentStatus]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 캘린더 영역 - 스크롤 가능한 컨테이너로 분리 */}
        <div className="flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {/* 데스크톱에서는 고정 높이, 모바일에서는 뷰포트의 70%로 조정 */}
          <div className="h-[calc(100vh-220px)] max-h-[800px] min-h-[500px] w-full overflow-auto bg-white lg:h-[650px]">
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
                        <span className="event-title">
                          {event.title}
                          {isMultiDayEvent && (
                            <span className="date-range-text ml-1 text-xs font-normal">
                              ({dayjs(event.start).format("M/D")}~{dayjs(event.end).format("M/D")})
                            </span>
                          )}
                        </span>
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
                  return (
                    <div
                      className={`w-full overflow-hidden p-1 ${containerClass} ${multiDayClass}`}
                    >
                      <div className="event-title-month">
                        {event.title}
                        {isMultiDayEvent && (
                          <span className="ml-1 text-xs font-normal">
                            ({dayjs(event.start).format("M/D")}~{dayjs(event.end).format("M/D")})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                // 일별 뷰 등 기타 뷰
                return (
                  <div className={`w-full overflow-hidden p-1 ${containerClass} ${multiDayClass}`}>
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

                  // 일정목록 뷰에서 타이틀 내부 스팬 선택
                  if (info.view.type === "listWeek") {
                    // 날짜 범위 텍스트가 포함된 span을 찾기
                    const dateRangeSpans = info.el.querySelectorAll(".date-range-text");
                    if (dateRangeSpans.length > 0) {
                      // 이미 있다면 날짜 범위 스팬 색상 직접 설정
                      dateRangeSpans.forEach((span) => {
                        (span as HTMLElement).style.color = "#4285f4";
                      });
                    } else {
                      // 없다면 새로 생성하여 날짜 범위 추가
                      const titleElement = info.el.querySelector(".fc-list-event-title a");
                      if (titleElement) {
                        const dateRangeText = document.createElement("span");
                        dateRangeText.className = "date-range-text ml-1 text-xs font-normal";
                        dateRangeText.style.color = "#4285f4";
                        dateRangeText.textContent = `(${dayjs(info.event.start).format(
                          "M/D"
                        )}~${dayjs(info.event.end).format("M/D")})`;
                        titleElement.appendChild(dateRangeText);
                      }
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

        {/* 모바일 화면에서 하단 네비게이션 바가 있을 경우를 위한 여백 */}
        <div className="h-4 md:h-0"></div>
      </div>
      <style jsx global>{`
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

        .event-title,
        .event-time,
        .event-location {
          font-size: 0.75rem;
          overflow: hidden;
          text-overflow: clip;
          white-space: normal;
          word-break: break-word;
          line-height: 1.2;
        }

        .event-title {
          font-weight: 600;
        }

        /* 월별 뷰 제목 스타일 - 줄 제한 없음 */
        .event-title-month {
          font-size: 0.75rem;
          font-weight: 600;
          overflow: hidden;
          white-space: normal;
          word-break: break-word;
          line-height: 1.2;
        }

        /* 그리드 셀에 맞추기 위한 컨테이너 스타일 */
        .event-content-month {
          overflow: hidden; /* 컨테이너를 넘어가는 내용 숨김 */
        }

        /* 다일 이벤트의 월뷰/주뷰 스타일 */
        .multi-day-event .event-title-month {
          display: block; /* flex에서 block으로 변경 */
        }

        .multi-day-event .event-title-month span {
          color: #4285f4;
          font-size: 0.65rem;
          white-space: normal; /* nowrap 제거 */
          display: block; /* inline에서 block으로 변경 */
          margin-top: 2px;
        }

        /* 모든 뷰에서 날짜 범위 색상 통일 */
        .multi-day-event .event-title-month span,
        .multi-day-event .event-title span,
        .date-range-text,
        .fc-list-event .event-title span,
        .fc-list-event .date-range-text {
          color: #4285f4 !important;
          font-size: 0.65rem;
        }

        /* 일정목록 뷰 날짜 범위 스타일 */
        .fc-list-event .fc-list-event-title a {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }

        .fc-list-event .fc-list-event-title a span {
          color: #4285f4 !important; /* !important로 우선순위 높임 */
          font-size: 0.65rem;
          margin-left: 4px;
        }

        /* 일정목록 뷰의 다일 이벤트 배경색 강조 */
        .fc-list-event.multi-day-event {
          background-color: rgba(255, 87, 34, 0.05);
        }

        /* 일정목록 뷰의 날짜 범위 스타일 강화 */
        .fc-list-event .fc-list-event-title a .date-range-text,
        .fc-list-event.multi-day-event .fc-list-event-title a span,
        .fc-list-event-title .date-range-text {
          color: #4285f4 !important;
          font-size: 0.65rem;
          margin-left: 4px;
          font-weight: normal;
        }

        /* !important 규칙으로 최대한 우선순위 높임 */
        .date-range-text {
          color: #4285f4 !important;
        }

        /* 일정목록 뷰의 장소 텍스트 스타일 */
        .location-text {
          display: flex;
          align-items: center;
          color: #666;
          font-size: 0.7rem;
          margin-top: 0.25rem;
        }

        /* 일정목록 뷰에서 더 나은 여백 제공 */
        .fc-list-event td {
          padding: 8px 14px !important;
        }

        /* 주뷰 특화 스타일 */
        .fc-timegrid-event-harness {
          overflow: visible !important; /* 내용이 보이도록 설정 */
        }

        .fc-timegrid-event {
          overflow: visible !important;
          height: auto !important;
          min-height: auto !important;
        }

        /* 주뷰에서의 제목과 날짜 스타일 */
        .fc-timegrid-event .event-title-month {
          display: block;
          word-break: break-word;
          white-space: normal;
        }

        /* FC 이벤트 높이 조정 (주뷰에서 이벤트 높이 자동 조정) */
        .fc-timegrid-event {
          overflow: hidden !important;
          min-height: auto !important;
        }

        /* 이벤트 스타일 공통 */
        .fc-daygrid-event,
        .fc-timegrid-event {
          display: block;
          overflow: hidden;
        }

        .event-content-day {
          max-height: none;
        }

        .event-content-list {
          max-height: none;
        }

        .fc-event-main {
          padding: 1px;
        }

        /* 월별 뷰 이벤트 스타일 수정 */
        .fc-daygrid-event {
          min-height: 1.2rem; /* 최소 1줄 높이 */
          max-height: 2.4rem; /* 최대 2줄 높이 */
          overflow: hidden; /* 넘치는 내용 가림 */
          margin: 1px 0;
          position: relative;
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }

        /* 월별 뷰 제목 스타일 수정 */
        .fc-daygrid-event .event-title-month {
          font-size: 0.75rem;
          font-weight: 600;
          line-height: 1.2;
          display: -webkit-box;
          -webkit-line-clamp: 2; /* 최대 2줄로 제한 */
          -webkit-box-orient: vertical;
          overflow: hidden; /* 넘치는 내용 가림 */
          word-wrap: break-word;
          text-overflow: clip; /* ellipsis를 clip으로 변경하여 말줄임표 제거 */
        }

        /* 월별 뷰 컨테이너 스타일 */
        .fc-daygrid-event .event-content-month {
          height: 100%;
          max-height: 2.4rem; /* 최대 2줄로 제한 */
          overflow: hidden; /* 넘치는 내용 가림 */
          padding: 1px;
        }

        .fc-daygrid-event::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 50%;
          background-color: #4285f4;
        }

        /* 일정목록 뷰에서 장소 텍스트 스타일 */
        .location-text {
          display: flex;
          align-items: center;
          color: #666;
          font-size: 0.7rem;
          margin-top: 0.25rem;
        }

        .location-icon {
          font-size: 0.75rem;
          color: #f59e0b;
        }

        /* 일정목록 뷰의 레이아웃 개선 */
        .fc-list-event td {
          padding: 8px 14px !important;
        }

        .fc-list-event-title a {
          font-weight: 500;
        }

        /* 이벤트 제목과 장소 간격 조절 */
        .fc-list-event .fc-list-event-title {
          padding-right: 1rem !important;
        }

        /* 캘린더 컨테이너에 대한 추가 스타일 */
        .fc {
          height: 100% !important;
        }

        /* 모바일 최적화 스타일 */
        @media (max-width: 640px) {
          .fc-header-toolbar {
            flex-direction: column;
            gap: 0.5rem;
          }

          .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
            width: 100%;
          }

          /* 모바일에서 버튼 그룹 레이아웃 */
          .fc-toolbar-chunk:last-child {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 4px;
          }

          /* 첫 번째 줄: 월, 주 */
          .fc-dayGridMonth-button,
          .fc-timeGridWeek-button {
            grid-row: 1;
          }

          /* 두 번째 줄: 일, 일정목록 */
          .fc-timeGridDay-button,
          .fc-listWeek-button {
            grid-row: 2;
          }
        }
      `}</style>
    </Layout>
  );
}
