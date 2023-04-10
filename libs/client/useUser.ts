// import { useRouter } from "next/router";
// import { useEffect, useState } from "react";

// export default function useUser() {
//   const [user, setUser] = useState();
//   const router = useRouter();

//   useEffect(() => {
//     fetch("/api/users/me")
//       .then((response) => response.json())
//       .then((data) => {
//         if (data.ok) {
//           setUser(data.profile);
//         } else {
//           router.replace("/enter");
//         }
//       });
//   }, [router]);
//   return user;
// }
import useSWR from "swr";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  return await response.json();
};

export default function useUser() {
  const { data, error } = useSWR("/api/users/me", fetcher);
  return data;
}
