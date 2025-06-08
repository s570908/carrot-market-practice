const webpush = require('web-push');

// VAPID 키 생성
const vapidKeys = webpush.generateVAPIDKeys();

console.log('=======================================');
console.log('VAPID 키가 생성되었습니다.');
console.log('=======================================');
console.log('공개키(NEXT_PUBLIC_VAPID_PUBLIC_KEY):');
console.log(vapidKeys.publicKey);
console.log('=======================================');
console.log('비공개키(VAPID_PRIVATE_KEY):');
console.log(vapidKeys.privateKey);
console.log('=======================================');
console.log('.env.local 파일에 위 키를 설정해주세요.');
