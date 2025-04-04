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
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateAppointmentForm>();
  //const [location, setLocation] = useState<LocationData | null>(null);
  // const [showMapModal, setShowMapModal] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [notifications, setNotifications] = useState<any[]>([
    { title: "약속 알림", minutesBefore: 30, type: "PUSH" },
  ]);

  const [selectedLocationByAddressInfo, setSelectedLocationByAddressInfo] = useState<{
    latitude: number;
    longitude: number;
    addressInfo: TmapAddressInfo | null;
  } | null>(null);

  const location = selectedLocationByAddressInfo;

  const { openModal: openMapModal, renderModal } = useAwaitableModal((modal, params) => {
    return (
      <MapModal
        isOpen={modal.isVisible}
        onClose={() => modal.closeWithResult(null)} // null 값을 반환하여 선택된 위치를 초기화
        //onLocationSelect={(latitude: number, longitude: number, address: string) =>
        //modal.closeWithResult({ latitude, longitude, address })
        // console.log(
        //   "onLocationSelect--latitude: ",
        //   latitude,
        //   "longitude: ",
        //   longitude,
        //   "address: ",
        //   address
        // )
        // }
        onLocationSelectAddressInfo={(
          latitude: number,
          longitude: number,
          addressInfo: TmapAddressInfo | null
        ) => modal.closeWithResult({ latitude, longitude, addressInfo })}
      />
    );
  });

  const handleOpenModal = async () => {
    try {
      const result = await openMapModal(null);
      console.log("Modal closed--result: ", result);
      if (result) {
        const { latitude, longitude, addressInfo } = result;
        //setSelectedLocation({ latitude, longitude, address });
        setSelectedLocationByAddressInfo({ latitude, longitude, addressInfo });
      } else {
        console.log("Modal closed without selecting a location.");
        setSelectedLocationByAddressInfo(null); // 선택된 위치를 초기화
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
      // 성공 처리 (예: 토스트 메시지, 리다이렉션 등)
      if (data.ok) {
        toast.success("약속이 생성되었습니다");
        //router.push("/appointments");
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
    if (createData?.ok) {
      router.push(`/appointments/${createData?.appointment?.id}`);
    }
  }, [createData, router]);

  // 지도에서 위치 선택 처리
  // const handleLocationSelect = (locationData: LocationData) => {
  //   setSelectedLocation(locationData);
  //   //setShowMapModal(false);
  // };

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

  // const handleOpenModal = async () => {
  //   try {
  //     const result = await openMapModal(null);
  //     console.log("Modal closed--result: ", result);
  //     if (result) {
  //       const { latitude, longitude, address } = result;
  //       setSelectedLocation({ latitude, longitude, address });
  //     } else {
  //       console.log("Modal closed without selecting a location.");
  //       setSelectedLocation(null); // 선택된 위치를 초기화
  //     }
  //   } catch (error) {
  //     console.error("Error opening modal:", error);
  //   }
  // };

  // 약속 생성 제출

  const onSubmit = async (formData: CreateAppointmentForm) => {
    if (!location) {
      alert("약속 장소를 선택해주세요.");
      return;
    }

    const appointmentData: AppointmentCreateRequest = {
      ...formData,
      location,
      participants: selectedParticipants,
      notifications,
    };

    console.log("onSubmit--약속 생성 데이터:", appointmentData);

    createAppointment(appointmentData);

    // try {
    //   // 약속 생성 요청
    //   const result = await createAppointment(appointmentData);

    //   if (result.ok) {
    //     // 성공 메시지 표시 (toast 라이브러리 사용시)
    //     toast.success("약속이 생성되었습니다");

    //     // 약속 목록 페이지로 자동 이동
    //     router.push("/appointments");
    //   } else {
    //     toast.error(result.error || "약속 생성에 실패했습니다");
    //   }
    // } catch (error) {
    //   console.error("약속 생성 오류:", error);
    //   toast.error("약속 생성 중 오류가 발생했습니다");
    // }
  };

  const friends = friendsData?.friends || [];

  return (
    <>
      {renderModal()}
      <Layout title="약속 만들기" seoTitle="약속 만들기 | Carrot Market">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
          <Input
            register={register("title", { required: "제목은 필수입니다." })}
            name="title"
            label="약속 제목"
            type="text"
            placeholder="약속 제목을 입력하세요"
            //errorMessage={errors.title?.message}
          />

          <TextArea
            register={register("description")}
            name="description"
            label="약속 설명"
            placeholder="약속에 대한 자세한 내용을 입력하세요"
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">날짜</label>
            <DatePicker
              onChange={(date: Date) => setValue("date", date)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">시작 시간</label>
              <TimePicker
                onChange={(time: Date) => setValue("startTime", time)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">종료 시간</label>
              <TimePicker
                onChange={(time: Date) => setValue("endTime", time)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">약속 장소</label>
            {location ? (
              <div className="rounded-md border border-gray-300 p-4">
                {/* <p className="font-medium">{location.name}</p> */}
                <p className="text-sm text-gray-600">{location.addressInfo?.fullAddress}</p>
                <div className="mt-0 flex space-x-2">
                  <Button onClick={handleOpenModal} text="장소 변경" />
                </div>
              </div>
            ) : (
              <Button onClick={handleOpenModal} text="지도에서 장소 선택" className="w-full" />
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">참석자</label>
            <div className="max-h-40 overflow-y-auto rounded-md border border-gray-300 p-2">
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
                      <div className="mr-2 h-8 w-8 rounded-full bg-gray-300"></div>
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
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">알림 설정</label>
              <button type="button" onClick={addNotification} className="text-sm text-blue-500">
                + 알림 추가
              </button>
            </div>

            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 rounded-md border border-gray-300 p-2"
                >
                  <input
                    type="text"
                    value={notification.title}
                    onChange={(e) => updateNotification(index, "title", e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                    placeholder="알림 제목"
                  />
                  <select
                    value={notification.minutesBefore}
                    onChange={(e) =>
                      updateNotification(index, "minutesBefore", Number(e.target.value))
                    }
                    className="rounded-md border border-gray-300 py-2 pl-3 pr-9"
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
          <Button type="submit" text="약속 만들기" loading={createLoading} className="w-full" />
        </form>
      </Layout>
    </>
  );
}
