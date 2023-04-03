## Token을 이용한 authentication

user login

- user enter email or phone number

server

- email, phone이 있는 경우에만 prisma client의 findUnique를 사용하여 email, phone을 활용해서 기존 디비에서 사용자를 찾습니다. 만약 유저가 없다면, name은 임의로 "Anonymous"로 주고 phone, email을 주어진 데이터로 하여서 추가해 주었습니다.
- make token and store it with user connected to the token
- send the token to email or phone

user input the token and send it to server

server

- make sure if the token should be valid.
- if valid, delete all tokens connected with the user
- else redirect to user login
