import Link from "next/link";
import React from "react";

interface FloatingButton {
  href: string;
  children: React.ReactNode;
}

const FloatingButton = ({ href, children }: FloatingButton) => {
  return (
    <Link href={href}>
      <a className="fixed bottom-24 right-5 cursor-pointer rounded-full bg-orange-400 p-4 text-white shadow-xl transition-colors duration-300 hover:bg-orange-500">
        {children}
      </a>
    </Link>
  );
};
export default FloatingButton;
