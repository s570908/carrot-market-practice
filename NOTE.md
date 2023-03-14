Why This Error Occurred

Next.js 13버전이 나오면서, Link 태그는<a>로 렌더링 되므로 <a>를 사용하는 시도는 유효하지 않다고 하네요!

How to solve the problem

npx @next/codemod new-link .
