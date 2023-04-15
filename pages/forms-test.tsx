import { useState } from "react";

export default function Forms() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErros, setFormErros] = useState("");
  const onUsernameChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const {
      currentTarget: { value },
    } = event;
    setUsername(value);
  };
  const onEmailChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const {
      currentTarget: { value },
    } = event;
    setEmail(value);
  };
  const onPasswordChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const {
      currentTarget: { value },
    } = event;
    setPassword(value);
  };
  const onSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (username === "" || email === "" || password === "") {
      setFormErros("All fields are required");
    }
    console.log(username, email, password);
  };

  return (
    <form onSubmit={onSubmit}>
      <input
        value={username}
        onChange={onUsernameChange}
        type="text"
        placeholder="Username"
        required
      />
      <input value={email} onChange={onEmailChange} type="email" placeholder="Email" required />
      <input
        value={password}
        onChange={onPasswordChange}
        type="password"
        placeholder="Password"
        required
      />
      <input type="submit" value="Create Account" />
    </form>
  );
}
