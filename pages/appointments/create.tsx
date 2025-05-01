// c:\Users\Song\Documents\DebugJS\appointment-nextjs\pages\appointments\create.tsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import Layout from "@/components/Layout";
import Button from "@/components/Button";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getFriends, writeAppointment } from "@/apiLibs/appointments";
import ImgComponent from "@components/ImgComponent";
import { useAwaitableModal } from "@libs/client/useAwaitableModal";
import MapModal from "@components/MapModal";
import { AppointmentCreateRequest, CreateAppointmentForm, TmapAddressInfo } from "@/types";
import { toast } from "react-toastify";
import AppointmentParticipantsList from "@components/appointments/AppointmentParticipantsList";
import useSocket from "@libs/client/useSocket";
import useUser from "@libs/client/useUser";

// 간소화된 DatePicker, TimePicker 컴포넌트 (실제로는 기존 구현된 컴포넌트 사용)
const DatePicker = ({ onChange, className }: any) => (
  <input type="date" onChange={(e) => onChange(new Date(e.target.value))} className={className} />
);

const TimePicker = ({ onChange, className }: any) => (
  <input
    type="time"
    onChange={(e) => onChange(new Date(`2000-01-01T${e.target.value}`))}
    className={className}
  />
);

// 참가자 타입
interface User {
  id: number;
  name: string;
  avatar?: string;
}

export default function CreateAppointment() {
  const router = useRouter();
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateAppointmentForm>({
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [notifications, setNotifications] = useState<any[]>([
    { title: "약속 알림", minutesBefore: 30, type: "PUSH" },
  ]);

  const [selectedLocationByAddressInfo, setSelectedLocationByAddressInfo] = useState<{
    latitude: number;
    longitude: number;
    addressInfo: TmapAddressInfo;
    selectedAddress: string | null;
    locationName: string;
  } | null>(null);

  const location = selectedLocationByAddressInfo;
  console.log("create--Selected location:", location);

  // 시작 날짜와 시간을 위한 상태 추가
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [startTimeState, setStartTimeState] = useState<Date>(new Date());

  // 종료 날짜와 시간을 위한 상태 추가
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [endTimeState, setEndTimeState] = useState<Date>(new Date());

  // useSocket 훅 사용하여 소켓 연결
  const [socket, connected] = useSocket("market");

  // useAwaitableModal을 사용하여 MapModal 컴포넌트를 렌더링
  // params를 initialLocation으로 전달하여 모달이 열릴 때 초기 위치 정보를 설정
  const { openModal: openMapModal, renderModal } = useAwaitableModal((modal, params) => {
    return (
      <MapModal
        isOpen={modal.isVisible}
        initialLocation={params}
        onClose={() => modal.closeWithResult(null)}
        onLocationSelectAddressInfo={(
          latitude: number,
          longitude: number,
          addressInfo: TmapAddressInfo | null,
          selectedAddress: string | null
        ) => modal.closeWithResult({ latitude, longitude, addressInfo, selectedAddress })}
      />
    );
  });

  const handleOpenModal = async (e?: React.MouseEvent) => {
    // 이벤트가 있는 경우 기본 동작 방지 (폼 제출 방지)
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      // location 정보를 인자로 전달하여 MapModal이 초기화될 때 이 정보를 사용하도록 함
      console.log("openMapModal 직전--location:", location);
      const result = await openMapModal(location);
      console.log("Modal closed--result: ", result);
      if (result) {
        const { latitude, longitude, addressInfo, selectedAddress, locationName } = result;
        setSelectedLocationByAddressInfo({
          latitude,
          longitude,
          addressInfo,
          selectedAddress,
          locationName,
        });
      } else {
        console.log("Modal closed without selecting a location.");
        // 선택된 위치를 초기화하지 않도록 수정 (기존 위치 유지)
        // setSelectedLocationByAddressInfo(null);
      }
    } catch (error) {
      console.error("Error opening modal:", error);
    }
  };

  // React Query를 사용한 코드:
  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: () => getFriends(),
  });

  const {
    mutate: createAppointment,
    isPending: createLoading,
    data: createData,
    error: createError,
  } = useMutation({
    mutationFn: writeAppointment,
    onSuccess: (data) => {
      if (data.ok) {
        toast.success("약속이 생성되었습니다");
      } else {
        toast.error(data.error || "약속 생성에 실패했습니다");
      }
    },
    onError: (error) => {
      console.error("약속 생성 중 오류가 발생했습니다:", error);
      toast.error("약속 생성 중 오류가 발생했습니다");
    },
  });

  // 약속 생성 후 처리
  useEffect(() => {
    if (createData?.ok && socket && user?.id) {
      // 약속 생성 성공 시 소켓 이벤트 발신
      if (createData.appointment?.id) {
        // 소켓을 통해 약속 생성 알림 발송
        socket.emit("appointment_created", {
          appointmentId: createData.appointment.id,
          organizerId: user.id,
          participantIds: selectedParticipants,
        });

        console.log("약속 생성 이벤트를 소켓 서버에 전송했습니다.");
      }
      // 생성 완료 후 상세 페이지로 이동
      router.push(`/appointments/${createData?.appointment?.id}`);
    }
  }, [createData, router, user?.id, selectedParticipants, connected, socket]);

  // 참가자 선택 처리
  const handleParticipantToggle = (userId: number) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // 알림 추가
  const addNotification = () => {
    setNotifications([...notifications, { title: "약속 알림", minutesBefore: 30, type: "PUSH" }]);
  };

  // 알림 수정
  const updateNotification = (index: number, field: string, value: any) => {
    const updatedNotifications = [...notifications];
    updatedNotifications[index] = {
      ...updatedNotifications[index],
      [field]: value,
    };
    setNotifications(updatedNotifications);
  };

  // 알림 삭제
  const removeNotification = (index: number) => {
    setNotifications(notifications.filter((_, i) => i !== index));
  };

  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
    setEndDate(date);
  };

  const handleStartTimeChange = (time: Date) => {
    setStartTimeState(time);
  };

  const handleEndDateChange = (date: Date) => {
    setEndDate(date);
  };

  const handleEndTimeChange = (time: Date) => {
    setEndTimeState(time);
  };

  const onSubmit = async (formData: CreateAppointmentForm) => {
    if (!location) {
      alert("약속 장소를 선택해주세요.");
      return;
    }

    const combineDateTime = (date: Date, time: Date) => {
      const result = new Date(date);
      result.setHours(time.getHours(), time.getMinutes(), 0, 0);
      return result;
    };

    const startDateTime = combineDateTime(startDate, startTimeState);
    const endDateTime = combineDateTime(endDate, endTimeState);

    // 알림 정보를 제외한 약속 데이터 생성 (appointmentnotification 테이블이 없음)
    const appointmentData: AppointmentCreateRequest = {
      ...formData,
      startTime: startDateTime,
      endTime: endDateTime,
      location,
      participants: selectedParticipants,
      // notifications 필드 제거 또는 빈 배열로 설정
      notifications: [], // 빈 배열로 설정하여 알림 생성 시도를 방지
    };

    console.log("onSubmit--약속 생성 데이터:", appointmentData);
    createAppointment(appointmentData);
  };

  const friends = friendsData?.friends || [];

  return (
    <>
      {renderModal()}
      <Layout title="약속 만들기" seoTitle="약속 만들기 | Carrot Market">
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <Input
            register={register("title", { required: "제목은 필수입니다." })}
            name="title"
            label="약속 제목"
            type="text"
            placeholder="약속 제목을 입력하세요"
          />

          <TextArea
            register={register("description")}
            name="description"
            label="약속 설명"
            placeholder="약속에 대한 자세한 내용을 입력하세요"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">시작 날짜</label>
              <DatePicker
                onChange={handleStartDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">시작 시간</label>
              <TimePicker
                onChange={handleStartTimeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">종료 날짜</label>
              <DatePicker
                onChange={handleEndDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">종료 시간</label>
              <TimePicker
                onChange={handleEndTimeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">약속 장소</label>
            {location ? (
              <div className="p-4 border border-gray-300 rounded-md">
                <p className="text-sm text-gray-600">{location.selectedAddress}</p>
                <div className="flex mt-0 space-x-2">
                  <Button
                    onClick={(e: React.MouseEvent<Element, MouseEvent> | undefined) =>
                      handleOpenModal(e)
                    }
                    text="장소 변경"
                    type="button"
                  />
                </div>
              </div>
            ) : (
              <Button
                onClick={(e: React.MouseEvent<Element, MouseEvent> | undefined) =>
                  handleOpenModal(e)
                }
                text="지도에서 장소 선택"
                className="w-full"
                type="button"
              />
            )}
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium text-gray-700">초대된 참가자</label>

            {selectedParticipants.length > 0 ? (
              <>
                <div className="max-h-[200px] overflow-y-auto rounded-md border border-gray-300 p-2">
                  {selectedParticipants.map((pId) => {
                    const friend = friends.find((f: any) => f.id === pId);
                    return (
                      <div key={pId} className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {friend?.avatar ? (
                            <ImgComponent
                              width={32}
                              height={32}
                              clsProps="mr-2 rounded-full"
                              imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${friend.avatar}/public`}
                              imgName={friend.name}
                            />
                          ) : (
                            <div className="w-8 h-8 mr-2 bg-gray-300 rounded-full"></div>
                          )}
                          <span>{friend?.name || "알 수 없는 사용자"}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleParticipantToggle(pId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-gray-500">{selectedParticipants.length}명 초대됨</p>
              </>
            ) : (
              <p className="text-sm text-gray-500">선택된 참가자가 없습니다.</p>
            )}

            <button
              type="button"
              onClick={() =>
                document.getElementById("friend-section")?.scrollIntoView({ behavior: "smooth" })
              }
              className="flex items-center justify-center w-full gap-1 p-2 mt-3 text-sm text-gray-600 bg-white border border-gray-300 border-dashed rounded-md hover:bg-gray-50"
            >
              {/* SVG 대신 텍스트 사용 */}
              <span className="text-lg">+</span> <span>참가자 추가</span>
            </button>
          </div>

          {/* 참가자 선택 섹션에 ID 추가 */}
          <div id="friend-section">
            <label className="block mb-1 text-sm font-medium text-gray-700">참석자</label>
            <div className="p-2 overflow-y-auto border border-gray-300 rounded-md max-h-40">
              {friendsLoading ? (
                <p className="py-2 text-center text-gray-500">참가자 목록을 불러오는 중...</p>
              ) : friends.length > 0 ? (
                friends.map((friend: User) => (
                  <div key={friend.id} className="flex items-center p-2 hover:bg-gray-100">
                    <input
                      type="checkbox"
                      id={`friend-${friend.id}`}
                      checked={selectedParticipants.includes(friend.id)}
                      onChange={() => handleParticipantToggle(friend.id)}
                      className="mr-2"
                    />
                    {friend.avatar ? (
                      <ImgComponent
                        width={32}
                        height={32}
                        clsProps="mr-2 rounded-full"
                        imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${friend.avatar}/public`}
                        imgName={friend.name}
                      />
                    ) : (
                      <div className="w-8 h-8 mr-2 bg-gray-300 rounded-full"></div>
                    )}
                    <span>{friend.name}</span>
                  </div>
                ))
              ) : (
                <p className="py-2 text-center text-gray-500">선택 가능한 친구가 없습니다.</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">알림 설정</label>
              <div className="text-xs text-red-500">현재 알림 기능을 사용할 수 없습니다</div>
            </div>
            <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
              <p className="text-sm text-gray-500">알림 기능은 현재 준비 중입니다.</p>
            </div>
          </div>
          <Button type="submit" text="약속 만들기" loading={createLoading} className="w-full" />
        </form>
      </Layout>
    </>
  );
}
