# useIntersectionObserver hook

https://usehooks-ts.com/react-hook/use-intersection-observer

# Why This Error Occurred

- Next.js 13버전이 나오면서, Link 태그는`<a>`로 렌더링 되므로 `<a>`를 사용하는 시도는 유효하지 않다고 하네요!

- How to solve the problem: <br />
  npx @next/codemod new-link .

# how to remove firefox's Default Dropdown for input html

https://stackoverflow.com/questions/71296535/how-to-remove-arrow-on-input-type-number-with-tailwind-css

# How to Remove Arrow on Input type Number with Tailwind CSS

https://stackoverflow.com/questions/71296535/how-to-remove-arrow-on-input-type-number-with-tailwind-css

# Data Fetching에 대해 알아보기 (3) - ISR

https://jforj.tistory.com/m/314

# NextJS와 ISR

https://velog.io/@seungchan__y/NextJS%EC%99%80-ISR

1. /libs/server/db.json에 update 혹은 create 가 발생하였고 이것을 알게된 webhook 이나 알림서비스가 POST request를 /api/revalidate-book 에 보낸다

2. 즉,....

```js
POST http://localhost:3000/api/revalidate-books?secret=nalnari
Content-Type: application/json

{
  "id": "9"
}
```

3. /api/revalidate-book 핸들러는 authentication을 수행하여 정당한 request인가를 확인한 후에 ISR을 수행하여서 cache를 업데이트한다.

# SSR+SWR by hyunseo 에 대한 결과 관찰

"홈을 들어가면 좋아요가 0 -> DB값 으로 바뀌는 것을 확인할 수 있었습니다.": 그러나 SSR에서는 바뀌지 않는다. 그 이유는 홈으로 들어갈 때마다 즉, "/"로 요청될 때마다
SSR이 일어나고 api/products가 수행되고 fav는 불러오지 않고 따라서 "좋아요"는 항상 0이다. SSR을 SSG로 변경하면 될 것 같다.

# Next JS Upload File / Images to Local Directory

https://www.youtube.com/watch?app=desktop&v=QTD9L0jL0dU

Tofik Nuryanto
6 months ago
but the images cannot accessed on production mode

3

Reply

3 replies
Bachar El karni
Bachar El karni
6 months ago
Is there an alternative to this cuz i'm facing this exact prob

Reply

Tofik Nuryanto
Tofik Nuryanto
6 months ago (edited)
Absolutely you need 1 step to access your image after image uploaded.

1. Re build your app, so image will detected 😁 or ...
2. Create an API to serve your image.

Example:
Create api file usual /pages/api/images/[filename].jsx
import fs
read data file using query filename
Send the image to client
😁
Show less

2

Reply

Bachar El karni
Bachar El karni
6 months ago
@Tofik Nuryanto thanks

Reply

# Tmapv2 event type

- event 동작이 안될 경우 브라우져의 extension 과의 충돌이 있을 수 있으므로, 그 경우에는 incognito 브라우져에서 앱을 수행시켜야 한다.

  bounds_changed,
  center_changed,
  click,
  dblclick,
  drag,
  dragend,
  dragstart,
  zoom_changed,
  mouseenter,
  mouseleave,
  mousedown,
  mousemove,
  mouseup,
  mousewheel,
  touchstart,
  touchmove,
  touchend,
  touchcancel,
  keydown,
  keyup,
  contextmenu,
  resize

# 판매자가 상품 상태를 변경했을 때,

사용자가 필터 옵션(RadioButtonGroup)을 클릭하면 최신 데이터를 가져와 변경된 상태를 반영하도록 하는 기능

## 구현

1. 제품 상태 변경 이벤트(changeState)를 추적하는 상태 변수를 추가
2. handleOptionChange 함수를 수정하여:
   - 값이 변경되었을 때
   - changeState 이벤트가 발생했었다면
   - refetchChats를 실행하고
   - changeState 이벤트 기록을 초기화

## 작동 흐름

1. hasStateChanged 상태 변수를 추가하여 상품 상태 변경 이벤트를 추적합니다.
2. 소켓에 changeState 이벤트 리스너를 추가하여 상태 변경 시 hasStateChanged를 true로 설정합니다.
3. 사용자가 RadioButtonGroup에서 옵션을 변경하면:
   - 선택된 값이 실제로 변경되었는지 확인합니다.
   - hasStateChanged가 true이면 refetchChats를 호출하고 hasStateChanged를 false로 재설정합니다.

- [useIntersectionObserver hook](#useintersectionobserver-hook)
- [Why This Error Occurred](#why-this-error-occurred)
- [how to remove firefox's Default Dropdown for input html](#how-to-remove-firefoxs-default-dropdown-for-input-html)
- [How to Remove Arrow on Input type Number with Tailwind CSS](#how-to-remove-arrow-on-input-type-number-with-tailwind-css)
- [Data Fetching에 대해 알아보기 (3) - ISR](#data-fetching에-대해-알아보기-3---isr)
- [NextJS와 ISR](#nextjs와-isr)
- [SSR+SWR by hyunseo 에 대한 결과 관찰](#ssrswr-by-hyunseo-에-대한-결과-관찰)
- [Next JS Upload File / Images to Local Directory](#next-js-upload-file--images-to-local-directory)
- [Tmapv2 event type](#tmapv2-event-type)
- [판매자가 상품 상태를 변경했을 때,](#판매자가-상품-상태를-변경했을-때)
  - [구현](#구현)
  - [작동 흐름](#작동-흐름)
