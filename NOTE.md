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
