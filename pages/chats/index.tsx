import type { NextPage } from "next";
import Link from "next/link";

const Write: NextPage = () => {
  return (
    <div className="divide-y-[1px] py-10">
      {[...Array(5)].map((_, i) => (
        <Link href={`chats/${i}`} key={i}>
          <a className="mb-3 flex items-center space-x-3 px-3 py-2 ">
            <div className="h-12 w-12 rounded-full bg-slate-300" />
            <div>
              <p className="text-gray-700">Steve Jebs</p>
              <p className="text-sm text-gray-500">See you tomorrow in the corner at 2pm</p>
            </div>
          </a>
        </Link>
      ))}
    </div>
  );
};

export default Write;
