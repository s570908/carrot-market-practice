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
