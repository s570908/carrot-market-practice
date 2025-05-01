// 브라우저 푸시 서비스 내부에서 이루어지는 검증 (개념적 표현)
function receiveAndVerifyPushMessage(encryptedMessage) {
  // 1. 브라우저에 저장된 auth 키 사용
  // @ts-ignore
  const storedAuth = getStoredAuthSecret();

  // 2. auth 키로 메시지 서명 검증
  // @ts-ignore
  if (!verifyMessageSignature(encryptedMessage, storedAuth)) {
    console.error("메시지 서명 검증 실패: 잠재적 위/변조 시도");
    return null; // 검증 실패 시 메시지 폐기
  }

  // 3. 검증 성공 시 메시지 복호화 및 표시
  // @ts-ignore
  const storedP256dh = getStoredP256dhKey();

  // @ts-ignore
  const decryptionKey = deriveDecryptionKey(
    encryptedMessage.salt,
    encryptedMessage.publicKey,
    storedP256dh,
    storedAuth // 여기서도 auth가 사용됨
  );

  // @ts-ignore
  return decrypt(encryptedMessage.ciphertext, decryptionKey);
}

// 이후 서비스 워커에서 처리
self.addEventListener("push", (event) => {
  // @ts-ignore
  const payload = event.data.json();
  // 이 시점에서 payload는 이미 검증되고 복호화된 상태

  // @ts-ignore
  self.registration.showNotification(payload.title, {
    body: payload.body,
    data: payload.data,
  });
});
