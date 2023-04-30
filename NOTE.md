# Why This Error Occurred

Next.js 13버전이 나오면서, Link 태그는<a>로 렌더링 되므로 <a>를 사용하는 시도는 유효하지 않다고 하네요!

How to solve the problem

npx @next/codemod new-link .

# how to remove firefox's Default Dropdown for input html

https://stackoverflow.com/questions/71296535/how-to-remove-arrow-on-input-type-number-with-tailwind-css

# How to Remove Arrow on Input type Number with Tailwind CSS

https://stackoverflow.com/questions/71296535/how-to-remove-arrow-on-input-type-number-with-tailwind-css

# SSR+SWR by hyunseo 에 대한 결과 관찰

"홈을 들어가면 좋아요가 0 -> DB값 으로 바뀌는 것을 확인할 수 있었습니다.": 그러나 SSR에서는 바뀌지 않는다. 그 이유는 홈으로 들어갈 때마다 즉, "/"로 요청될 때마다
SSR이 일어나고 api/products가 수행되고 fav는 불러오지 않고 따라서 "좋아요"는 항상 0이다. SSR을 SSG로 변경하면 될 것 같다.
