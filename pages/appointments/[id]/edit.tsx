// c:\Users\Song\Documents\DebugJS\appointment-nextjs\pages\appointments\[id]\edit.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
//import useSWR from "swr";
import Layout from "@/components/Layout";
import ModButton from "@/components/ModButton";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
//import useMutation from "@/lib/useMutation";
import MapLocation from "@/components/MapLocation";
import { User } from "@prisma/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { getAppointment, getFriends, updateAppointment } from "@/apiLibs/appointments";
import { parseId } from "@libs/utils";

// DatePicker, TimePicker 컴포넌트 (실제 앱에서는 기존 구현을 사용)
const DatePicker = ({ onChange, value, className }: any) => (
  <input
    type="date"
    onChange={(e) => onChange(new Date(e.target.value))}
    value={value ? new Date(value).toISOString().split("T")[0] : ""}
    className={className}
  />
);

const TimePicker = ({ onChange, value, className }: any) => (
  <input
    type="time"
    onChange={(e) => onChange(new Date(`2000-01-01T${e.target.value}`))}
    value={value ? new Date(value).toISOString().substr(11, 5) : ""}
    className={className}
  />
);

interface EditForm {
  title: string;
  description: string;
  date: Date;
  startTime: Date;
  endTime: Date;
}

interface LocationData {
  name: string;
  address: string;
  fullAddressRoad: string;
  latitude: number;
  longitude: number;
  zoomLevel: number;
}

export default function EditAppointment() {
  const router = useRouter();
  const id = (router.query.id !== undefined ? parseId(router.query.id) : 0) ?? 0;
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EditForm>();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // 약속 정보 조회
  // const { data: appointmentData, error: appointmentError } = useSWR(
  //   id ? `/api/appointments/${id}` : null
  // );

  // 약속 정보 조회
  const {
    data: appointmentData,
    error: appointmentError,
    isLoading,
  } = useQuery({
    queryKey: ["appointment", id], // 쿼리 키
    queryFn: () => getAppointment(id!), // 리팩토링된 함수 사용
    enabled: !!id, // id가 존재할 때만 쿼리 실행
  });

  // 친구 목록 조회
  // const { data: friendsData } = useSWR<{ ok: boolean; friends: User[] }>("/api/users/friends");
  // 친구 목록 조회
  const {
    data: friendsData,
    error: friendsError,
    isLoading: isFriendsLoading,
  } = useQuery({
    queryKey: ["friends"], // 쿼리 키
    queryFn: () => getFriends(), // 리팩토링된 함수 사용
  });

  // 약속 수정 뮤테이션
  const {
    mutate: updateAppointmentMutation,
    isPending: loading,
    data,
    error,
  } = useMutation({
    mutationFn: (appointmentData: any) => updateAppointment(id, appointmentData), // API 함수 호출
    onSuccess: (data) => {
      if (data.ok) {
        router.push(`/appointments/${id}`); // 성공 시 리다이렉트
      }
    },
    onError: (error) => {
      console.error("약속 수정 중 오류 발생:", error); // 오류 처리
    },
  });

  // 약속 정보로 폼 초기화
  useEffect(() => {
    if (appointmentData?.appointment) {
      const { appointment } = appointmentData;

      setValue("title", appointment.title);
      setValue("description", appointment.description || "");
      setValue("date", new Date(appointment.date));
      setValue("startTime", new Date(appointment.startTime));
      setValue("endTime", new Date(appointment.endTime));

      setLocation({
        name: appointment.locationName,
        address: appointment.locationAddress,
        fullAddressRoad: appointment.roadAddress || "",
        latitude: appointment.latitude,
        longitude: appointment.longitude,
        zoomLevel: appointment.zoomLevel || 15,
      });

      setSelectedParticipants(appointment.participants.map((p: any) => p.user.id));

      setNotifications(
        appointment.notifications.map((n: any) => ({
          id: n.id,
          title: n.title,
          minutesBefore: n.minutesBefore,
          type: n.type,
          message: n.message,
        }))
      );
    }
  }, [appointmentData, setValue]);

  // 수정 결과 처리
  useEffect(() => {
    if (data?.ok) {
      router.push(`/appointments/${id}`);
    }
  }, [data, router, id]);

  // 지도에서 위치 선택
  const handleLocationSelect = (locationData: LocationData) => {
    setLocation(locationData);
    setShowMapModal(false);
  };

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

  // 수정 제출
  const onSubmit = (formData: EditForm) => {
    if (!location) {
      alert("약속 장소를 선택해주세요.");
      return;
    }

    updateAppointmentMutation({
      ...formData,
      location,
      participants: selectedParticipants,
      notifications,
    });
  };

  // 권한 확인
  if (appointmentData && appointmentData.userRole !== "organizer") {
    return (
      <Layout seoTitle="접근 거부" title="접근 거부">
        <div className="p-4">
          <p>이 약속을 수정할 권한이 없습니다.</p>
          <ModButton onClick={() => router.back()} className="mt-4">
            돌아가기
          </ModButton>
        </div>
      </Layout>
    );
  }

  if (appointmentError) {
    return (
      <Layout seoTitle="오류" title="오류">
        <div className="p-4">
          <p>약속 정보를 불러오는 중 오류가 발생했습니다.</p>
          <ModButton onClick={() => router.back()} className="mt-4">
            돌아가기
          </ModButton>
        </div>
      </Layout>
    );
  }

  return (
    <Layout seoTitle="약속 수정" title="약속 수정">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
        <Input
          register={register("title", { required: "제목은 필수입니다." })}
          name="title"
          label="약속 제목"
          type="text"
          placeholder="약속 제목을 입력하세요"
          //error={errors.title?.message}
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
            value={watch("date")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">시작 시간</label>
            <TimePicker
              onChange={(time: Date) => setValue("startTime", time)}
              value={watch("startTime")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">종료 시간</label>
            <TimePicker
              onChange={(time: Date) => setValue("endTime", time)}
              value={watch("endTime")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">약속 장소</label>

          {location ? (
            <div className="rounded-md border border-gray-300 p-4">
              <p className="font-medium">{location.name}</p>
              <p className="text-sm text-gray-600">{location.address}</p>
              <div className="mt-2 flex space-x-2">
                <ModButton onClick={() => setShowMapModal(true)}>장소 변경</ModButton>
              </div>
            </div>
          ) : (
            <ModButton onClick={() => setShowMapModal(true)} size="large">
              지도에서 장소 선택
            </ModButton>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">참석자</label>
          <div className="max-h-40 overflow-y-auto rounded-md border border-gray-300 p-2">
            {friendsData?.friends?.map((friend) => (
              <div key={friend.id} className="flex items-center p-2 hover:bg-gray-100">
                <input
                  type="checkbox"
                  id={`friend-${friend.id}`}
                  checked={selectedParticipants.includes(friend.id)}
                  onChange={() => handleParticipantToggle(friend.id)}
                  className="mr-2"
                />
                <label htmlFor={`friend-${friend.id}`} className="flex items-center">
                  {friend.avatar ? (
                    <Image
                      src={friend.avatar}
                      alt={friend.name}
                      width={32}
                      height={32}
                      className="mr-2 rounded-full"
                    />
                  ) : (
                    <div className="mr-2 h-8 w-8 rounded-full bg-gray-300"></div>
                  )}
                  <span>{friend.name}</span>
                </label>
              </div>
            ))}
            {(!friendsData?.friends || friendsData.friends.length === 0) && (
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
                  className="rounded-md border border-gray-300 px-3 py-2"
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

        <div className="flex justify-between">
          <ModButton
            onClick={() => router.back()}
            type="button"
            className="bg-gray-500 hover:bg-gray-600"
          >
            취소
          </ModButton>
          <ModButton type="submit" isLoading={true}>
            약속 수정
          </ModButton>
        </div>
      </form>

      {showMapModal && (
        <MapLocation onClose={() => setShowMapModal(false)} onSelect={handleLocationSelect} />
      )}
    </Layout>
  );
}
