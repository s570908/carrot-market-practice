import { NextPage } from "next";

const Write: NextPage = () => {
  return (
    <div className="flex flex-col items-start px-4 py-10">
      <textarea
        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:ring-offset-2"
        rows={4}
        placeholder="Answer this question"
      />
      <button className="mt-2 w-full rounded-md border border-transparent bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600 focus:ring-2 focus:ring-orange-600 focus:ring-offset-2">
        Reply
      </button>
    </div>
  );
};

export default Write;
