/**
 * A global object to track namespaces and their associated socket-user mappings.
 * Structure:
 * {
 *   [namespaceName: string]: {
 *     [socketId: string]: userId: number
 *   }
 * }
 */

const onlineMap: Record<string, Record<string, number>> = {};

// 실무에서는 redis 서버를 사용해야한다.
// nestjs에서는 하나의 file에는 하나의 export default를 사용하는 것이 좋다. 그래서 분리하였다.
// onlineMap의 구조:
// onlineMap은 여러 **네임스페이스(namespace)**를 관리하는 객체입니다.
// 각 네임스페이스는 소켓 ID와 사용자 ID의 매핑 정보를 갖는 객체로 표현됩니다.

//// onlineMap의 구조를 가정한 예제 데이터
// const onlineMap: Record<string, Record<string, number>> = {
//   "/ws-slack": {
//     "socket1": 101, // socket ID: 사용자 ID
//     "socket2": 102,
//   },
//   "/ws-project": {
//     "socket3": 201,
//     "socket4": 202,
//   },
// };

export default onlineMap;
