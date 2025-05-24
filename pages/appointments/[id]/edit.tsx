import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import Button from "@/components/Button";
import ModButton from "@/components/ModButton";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import { parseId } from "@libs/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getAppointment, updateAppointment, getFriends } from "@/apiLibs/appointments";
import { toast } from "react-toastify";
import useUser from "@libs/client/useUser";
import MapViewer from "@/components/MapViewer";
import { useAwaitableModal } from "@libs/client/useAwaitableModal";
import MapModal from "@/components/MapModal";
import { TmapAddressInfo } from "@/types";
import ImgComponent from "@components/ImgComponent";
import { AppointmentUpdateRequest } from "@/types";

// 참가자 타입
interface User {
  id: number;
  name: string;
  avatar?: string;
}

// 위치 데이터 인터페이스 추가
interface LocationData {
  latitude: number;
  longitude: number;
  locationName: string;
  fullAddress?: string;
  zoomLevel: number;
  addressInfo?: TmapAddressInfo | null;
}

// 간소화된 DatePicker, TimePicker 컴포넌트 (실제로는 기존 구현된 컴포넌트 사용)
const DatePicker = ({ onChange, className, value }: any) => (
  <input
    type="date"
    onChange={(e) => onChange(new Date(e.target.value))}
    className={className}
    value={value ? value.toISOString().split("T")[0] : ""}
  />
);

const TimePicker = ({ onChange, className, value }: any) => (
  <input
    type="time"
    onChange={(e) => onChange(new Date(`2000-01-01T${e.target.value}`))}
    className={className}
    value={value ? value.toTimeString().split(" ")[0].substring(0, 5) : ""}
  />
);

// 약속 수정 폼 인터페이스
export interface EditAppointmentForm {
  title: string;
  description: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  location?: LocationData;
}

export default function EditAppointment() {
  const router = useRouter();
  const id = parseId(router.query.id);
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [dateError, setDateError] = useState<string>("");
  const [timeError, setTimeError] = useState<string>("");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [notifications, setNotifications] = useState<{ title: string; minutesBefore: number }[]>(
    []
  );

  const [selectedLocationByAddressInfo, setSelectedLocationByAddressInfo] = useState<{
    latitude: number;
    longitude: number;
    addressInfo: TmapAddressInfo | null;
  } | null>(null);

  const selectedLocation = selectedLocationByAddressInfo;

  console.log("edit--selectedLocation: ", selectedLocation);

  const { openModal: openMapModal, renderModal } = useAwaitableModal((modal, params) => {
    return (
      <MapModal
        isOpen={modal.isVisible}
        onClose={() => modal.closeWithResult(null)}
        onLocationSelectAddressInfo={(
          latitude: number,
          longitude: number,
          addressInfo: TmapAddressInfo | null
        ) => modal.closeWithResult({ latitude, longitude, addressInfo })}
      />
    );
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<EditAppointmentForm>();

  // selectedLocationByAddressInfo가 변경될 때마다 form의 location 값을 업데이트
  useEffect(() => {
    if (selectedLocationByAddressInfo) {
      const { latitude, longitude, addressInfo } = selectedLocationByAddressInfo;
      const locationData: LocationData = {
        latitude,
        longitude,
        locationName: addressInfo?.buildingName || "선택된 위치",
        fullAddress: addressInfo?.fullAddress,
        zoomLevel: 15,
        addressInfo, // Include the addressInfo property
      };
      setValue("location", locationData);
    }
  }, [selectedLocationByAddressInfo, setValue]);

  // 약속 정보 가져오기
  const { data, error, isLoading } = useQuery({
    queryKey: ["appointment", id],
    queryFn: () => getAppointment(id!),
    enabled: !!id,
  });

  // 친구 목록 가져오기
  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
  });

  const friends = friendsData?.friends || [];

  // 약속 업데이트 뮤테이션
  const { mutate: update, isPending: updateLoading } = useMutation({
    mutationFn: (appointmentData: any) => updateAppointment(id!, appointmentData),
    onSuccess: () => {
      toast.success("약속이 성공적으로 수정되었습니다.");
      router.push(`/appointments/${id}`);
    },
    onError: (error) => {
      toast.error("약속 수정 중 오류가 발생했습니다.");
      console.error(error);
    },
  });

  useEffect(() => {
    // 데이터가 로드되면 폼 채우기
    if (data?.appointment) {
      const appointment = data.appointment;
      setValue("title", appointment.title);
      setValue("description", appointment.description || "");

      const dateObj = new Date(appointment.date);
      const startTimeObj = new Date(appointment.startTime);
      const endTimeObj = new Date(appointment.endTime);

      setSelectedDate(dateObj);
      setStartTime(startTimeObj);
      setEndTime(endTimeObj);

      // 위치 정보가 있는 경우 - locationData 인터페이스 맞춤
      if (appointment.locationTmap) {
        const locationData: LocationData = {
          locationName: appointment.locationTmap.locationName || "선택된 위치",
          latitude: appointment.locationTmap.latitude,
          longitude: appointment.locationTmap.longitude,
          fullAddress: appointment.locationTmap.fullAddress,
          zoomLevel: appointment.locationTmap.zoomLevel || 15,
          addressInfo: (appointment.locationTmap as any).addressInfo ?? null,
        };

        setLocation(locationData);
        setValue("location", locationData);
      }

      // 참가자 정보가 있는 경우
      if (appointment.participants) {
        setSelectedParticipants(appointment.participants.map((p: any) => p.userId));
      }

      // 알림 정보가 있는 경우
      if (appointment.notifications) {
        setNotifications(
          appointment.notifications.map((n: any) => ({
            title: n.title,
            minutesBefore: n.minutesBefore,
          }))
        );
      }
    }
  }, [data, setValue]);

  // 사용자가 약속 주최자인지 확인
  useEffect(() => {
    if (data && user && data.userRole !== "organizer") {
      toast.error("약속 주최자만 수정할 수 있습니다.");
      router.push(`/appointments/${id}`);
    }
  }, [data, user, router, id]);

  // 지도 모달 열기 핸들러
  const handleOpenMapModal = async () => {
    try {
      const result = await openMapModal(null);
      //console.log("Modal closed--result: ", result);
      if (result) {
        const { latitude, longitude, addressInfo } = result;
        setSelectedLocationByAddressInfo({ latitude, longitude, addressInfo });
      } else {
        //console.log("Modal closed without selecting a location.");
        setSelectedLocationByAddressInfo(null); // 선택된 위치를 초기화
      }
    } catch (error) {
      console.error("Error opening modal:", error);
    }
  };

  // 참가자 선택 토글 핸들러
  const handleParticipantToggle = (userId: number) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // 알림 추가 핸들러
  const addNotification = () => {
    setNotifications([...notifications, { title: "", minutesBefore: 30 }]);
  };

  // 알림 업데이트 핸들러
  const updateNotification = (index: number, field: string, value: string | number) => {
    const updatedNotifications = [...notifications];
    updatedNotifications[index] = {
      ...updatedNotifications[index],
      [field]: value,
    };
    setNotifications(updatedNotifications);
  };

  // 알림 제거 핸들러
  const removeNotification = (index: number) => {
    setNotifications(notifications.filter((_, i) => i !== index));
  };

  const onSubmit = (formData: EditAppointmentForm) => {
    setDateError("");
    setTimeError("");

    if (!selectedDate) {
      setDateError("날짜를 선택해주세요.");
      return;
    }

    if (!startTime || !endTime) {
      setTimeError("시작 시간과 종료 시간을 모두 선택해주세요.");
      return;
    }

    // 시작 시간이 종료 시간보다 늦으면 오류
    if (startTime >= endTime) {
      setTimeError("시작 시간은 종료 시간보다 빨라야 합니다.");
      return;
    }

    // 업데이트 데이터 정확하게 구성 - 위치 정보는 선택적으로 포함
    const baseUpdateData = {
      title: formData.title,
      description: formData.description,
      date: selectedDate!,
      startTime: startTime!,
      endTime: endTime!,
      participants: selectedParticipants,
      notifications: notifications.map((notification) => ({
        title: notification.title,
        minutesBefore: notification.minutesBefore,
        type: "PUSH",
      })),
    };

    // 위치 정보가 있는 경우에만 포함
    const updateData: AppointmentUpdateRequest = selectedLocationByAddressInfo
      ? {
          ...baseUpdateData,
          location: {
            latitude: selectedLocationByAddressInfo.latitude,
            longitude: selectedLocationByAddressInfo.longitude,
            //locationName: selectedLocationByAddressInfo.addressInfo?.buildingName || "선택된 위치",
            //fullAddress: selectedLocationByAddressInfo.addressInfo?.fullAddress,
            //zoomLevel: 15,
            addressInfo: selectedLocationByAddressInfo.addressInfo ?? null,
          },
        }
      : baseUpdateData; // 위치 정보가 없으면 기존 위치 유지

    console.log("onSubmit--약속 수정 데이터:", updateData);
    update(updateData);
  };

  if (isLoading) return <Layout seoTitle="로딩 중">약속 정보를 불러오는 중입니다...</Layout>;
  if (error) return <Layout seoTitle="오류">약속 정보를 불러오는 중 오류가 발생했습니다.</Layout>;

  const currentLocation = watch("location");

  return (
    <>
      {renderModal()}
      <Layout seoTitle="약속 수정" title="약속 수정" canGoBack backUrl={`/appointments/${id}`}>
        {/* 스크롤 구조 수정 */}
        <div className="pb-20">
          <div className="px-4 py-6 space-y-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 약속 제목 */}
              <Input
                label="약속 제목"
                name="title"
                type="text"
                register={register("title", { required: "약속 제목은 필수입니다" })}
                placeholder="약속 제목을 입력하세요"
                error={errors.title?.message}
              />

              {/* 약속 설명 */}
              <TextArea
                label="약속 설명"
                name="description"
                register={register("description")}
                placeholder="약속에 대한 자세한 설명을 입력하세요 (선택사항)"
              />

              {/* 날짜 선택 */}
              <div className="space-y-2">
                <label className="block mb-1 text-sm font-medium text-gray-700">날짜</label>
                <DatePicker
                  onChange={(date: Date) => setSelectedDate(date)}
                  value={selectedDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {dateError && <p className="mt-1 text-sm text-red-600">{dateError}</p>}
              </div>

              {/* 시간 선택 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block mb-1 text-sm font-medium text-gray-700">시작 시간</label>
                  <TimePicker
                    onChange={(time: Date) => setStartTime(time)}
                    value={startTime}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {timeError && !startTime && (
                    <p className="mt-1 text-sm text-red-600">{timeError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block mb-1 text-sm font-medium text-gray-700">종료 시간</label>
                  <TimePicker
                    onChange={(time: Date) => setEndTime(time)}
                    value={endTime}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {timeError && startTime && !endTime && (
                    <p className="mt-1 text-sm text-red-600">{timeError}</p>
                  )}
                </div>
              </div>

              {/* 위치 정보 표시 섹션 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="block mb-1 text-sm font-medium text-gray-700">약속 장소</h3>
                  <ModButton
                    onClick={handleOpenMapModal}
                    variant="outline"
                    size="small"
                    className="flex items-center"
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 mr-1"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                    장소 변경
                  </ModButton>
                </div>
                {selectedLocationByAddressInfo || currentLocation ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-white border border-gray-300 rounded-md">
                      <h4 className="font-medium text-gray-900">
                        {selectedLocationByAddressInfo
                          ? selectedLocationByAddressInfo.addressInfo?.buildingName || "선택된 위치"
                          : currentLocation?.locationName ?? "위치 정보 없음"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {selectedLocationByAddressInfo
                          ? selectedLocationByAddressInfo.addressInfo?.fullAddress
                          : currentLocation?.fullAddress ?? "위치 정보 없음"}
                      </p>
                    </div>
                    {/* 선택한 위치를 지도에 표시 */}
                    <div className="w-full overflow-hidden rounded-lg h-60">
                      <MapViewer
                        lat={
                          selectedLocationByAddressInfo?.latitude ?? currentLocation?.latitude ?? 0
                        }
                        lng={
                          selectedLocationByAddressInfo?.longitude ??
                          currentLocation?.longitude ??
                          0
                        }
                        name={
                          selectedLocationByAddressInfo?.addressInfo?.buildingName ||
                          currentLocation?.locationName
                        }
                        zoomLevel={15}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-sm text-center text-gray-500 border border-gray-300 border-dashed rounded-md bg-gray-50">
                    <p>
                      등록된 위치 정보가 없습니다. &apos;장소 변경&apos; 버튼을 눌러 위치를
                      설정해주세요.
                    </p>
                  </div>
                )}
              </div>

              {/* 참석자 섹션 */}
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">참석자</label>
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

              {/* 알림 설정 섹션 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">알림 설정</label>
                  <button type="button" onClick={addNotification} className="text-sm text-blue-500">
                    + 알림 추가
                  </button>
                </div>

                <div className="space-y-2">
                  {notifications.map((notification, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2 space-x-2 border border-gray-300 rounded-md"
                    >
                      <input
                        type="text"
                        value={notification.title}
                        onChange={(e) => updateNotification(index, "title", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="알림 제목"
                      />
                      <select
                        value={notification.minutesBefore}
                        onChange={(e) =>
                          updateNotification(index, "minutesBefore", Number(e.target.value))
                        }
                        className="py-2 pl-3 border border-gray-300 rounded-md pr-9"
                      >
                        <option value="5">5분 전</option>
                        <option value="15">15분 전</option>
                        <option value="30">30분 전</option>
                        <option value="60">1시간 전</option>
                        <option value="1440">하루 전</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeNotification(index)}
                        className="text-red-500"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 제출 버튼 */}
              <div className="pt-4">
                <Button text={updateLoading ? "저장 중..." : "변경 내용 저장하기"} />
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
}
