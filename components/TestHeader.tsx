import Link from "next/link";

export const TestHeader = () => {
  return (
    <nav className="mb-4 flex space-x-5 border-b-2 py-2">
      <Link href="/react-query-tutorial">Home</Link>
      <Link href="/axios-query">Axios Query</Link>
      <Link href="/react-query">React Query</Link>
      <Link href="/parallel-query">Parallel Query</Link>
    </nav>
  );
};
