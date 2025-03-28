// c:\Users\Song\Documents\DebugJS\appointment-nextjs\lib\notificationService.ts
import client from "@/libs/client/client";

export const checkAndSendNotifications = async () => {
  try {
    // 현재 시간
    const now = new Date();

    // 아직 전송되지 않은 알림 중 전송 시간이 된 알림 검색
    const notifications = await client.appointmentNotification.findMany({
      where: {
        isSent: false,
        appointment: {
          date: {
            gte: now, // 미래 약속만 고려
          },
        },
      },
      include: {
        appointment: {
          include: {
            organizer: true,
            participants: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    const notificationsToSend = notifications.filter((notification) => {
      const appointmentDate = new Date(notification.appointment.date);
      const notificationTime = new Date(
        appointmentDate.getTime() - notification.minutesBefore * 60000
      );

      // 알림 시간이 현재보다 이전이면 알림 전송
      return notificationTime <= now;
    });

    // 각 알림 처리
    for (const notification of notificationsToSend) {
      // 주최자에게 알림 전송
      await sendNotification({
        userId: notification.appointment.organizer.id,
        title: notification.title,
        message:
          notification.message ||
          `약속 "${notification.appointment.title}"이(가) ${notification.minutesBefore}분 후에 시작됩니다.`,
        type: notification.type,
      });

      // 참가자들에게 알림 전송 (수락한 참가자에게만)
      for (const participant of notification.appointment.participants) {
        if (participant.status === "confirmed") {
          await sendNotification({
            userId: participant.user.id,
            title: notification.title,
            message:
              notification.message ||
              `약속 "${notification.appointment.title}"이(가) ${notification.minutesBefore}분 후에 시작됩니다.`,
            type: notification.type,
          });
        }
      }

      // 알림 상태 업데이트
      await client.appointmentNotification.update({
        where: {
          id: notification.id,
        },
        data: {
          isSent: true,
          sentAt: now,
        },
      });
    }

    return notificationsToSend.length;
  } catch (error) {
    console.error("알림 처리 중 오류 발생:", error);
    throw error;
  }
};

// 알림 전송 함수 (실제 구현은 별도 서비스 연동 필요)
const sendNotification = async ({
  userId,
  title,
  message,
  type,
}: {
  userId: number;
  title: string;
  message: string;
  type: string;
}) => {
  // 타입에 따라 다른 알림 전송 방식 사용
  switch (type) {
    case "EMAIL":
      // 이메일 발송 로직
      console.log(`이메일 알림 전송 - 사용자 ID: ${userId}, 제목: ${title}, 내용: ${message}`);
      break;
    case "PUSH":
      // 푸시 알림 발송 로직
      console.log(`푸시 알림 전송 - 사용자 ID: ${userId}, 제목: ${title}, 내용: ${message}`);
      break;
    case "SMS":
      // SMS 발송 로직
      console.log(`SMS 알림 전송 - 사용자 ID: ${userId}, 제목: ${title}, 내용: ${message}`);
      break;
    default:
      console.log(`기본 알림 전송 - 사용자 ID: ${userId}, 제목: ${title}, 내용: ${message}`);
  }

  return true;
};
