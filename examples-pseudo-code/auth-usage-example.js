// @ts-nocheck
// 1. 약속 30분 전 알림 준비
const appointmentReminder = {
  title: "약속 알림",
  body: "30분 후 '팀 회의'가 시작됩니다.",
  data: { appointmentId: 12345 },
};

// 2. 메시지 암호화 및 서명 과정 (웹 푸시 라이브러리 내부 동작)
function sendPushNotification(subscription, payload) {
  // A. 난수 솔트(salt) 생성
  const salt = generateRandomSalt();

  // B. 임시 ECDH 키 쌍 생성
  const serverKeys = generateECDHKeyPair();

  // C. 공유 비밀 도출 (auth 키가 보안 소금으로 사용됨)
  const sharedSecret = deriveSharedSecret(
    serverKeys.privateKey,
    subscription.keys.p256dh,
    subscription.keys.auth, // auth 키가 여기서 메시지 출처 인증에 결정적 역할
    salt
  );

  // D. 메시지 암호화 키 및 nonce 도출 (HKDF - 키 유도 함수)
  const { encryptionKey, nonce } = deriveEncryptionMaterial(
    sharedSecret,
    subscription.keys.auth, // auth 키가 다시 사용됨 (추가 무결성 보장)
    salt
  );

  // E. 메시지 암호화 및 메시지 인증 코드(MAC) 생성
  // MAC 생성 과정에서 auth 키로부터 유도된 정보가 사용되어
  // 메시지가 정당한 발신자로부터 왔으며 변조되지 않았음을 보장
  const encryptedPayload = encrypt(payload, encryptionKey, nonce);

  // F. 최종 푸시 메시지 전송
  return webPush.sendNotification(subscription, encryptedPayload);
}
