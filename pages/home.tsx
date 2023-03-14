import FloatingButton from "@components/FloatingButton";
import Item from "@components/Item";
import type { NextPage } from "next";

const Home: NextPage = () => {
  let title, canGoBack, hasTabBar;
  title = "HOME Test";
  canGoBack = true;
  hasTabBar = true;
  return (
    <div className="p flex flex-col space-y-5 py-10">
      {[...Array(10)].map((_, i) => (
        <Item key={i} title="new iPhone 14" price={95} comments={1} hearts={1} />
      ))}
      <FloatingButton>
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </FloatingButton>
    </div>
  );
};

export default Home;
