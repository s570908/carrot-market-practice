import { NextPage } from "next";

const CommunityPostdetail: NextPage = () => {
  return (
    <div>
      <span className="mt-3 inline-flex flex-col rounded-full bg-gray-100 py-0.5 px-4 text-xs font-medium text-gray-800 backdrop:items-center">
        동네질문
      </span>
      <div className="flex items-center space-x-1 border-b px-3 py-2">
        <div className="h-10 w-10 rounded-full bg-slate-300"></div>
        <div>
          <p className="text-sm font-medium text-gray-700">Steve Jobs</p>
          <p className="text-xs font-medium text-gray-500">View profiles &rarr;</p>
        </div>
      </div>
      <div className="mt-2 border-b px-4 py-2 text-gray-700">
        <span className="font-medium text-orange-500">Q.</span> What is the best mandu restaurant?
      </div>

      <div className="mt-2 flex w-full space-x-5 border-b-[2px] px-4 py-2.5 text-gray-700">
        <div className="flex items-center space-x-2 text-sm">
          <div>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <div>궁금해요</div>
          <div>1</div>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <div>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              ></path>
            </svg>
          </div>
          <div>답변</div>
          <div>1</div>
        </div>
      </div>

      <div className="my-5 space-y-5 px-4">
        {[...Array(4)].map((_, i) => {
          return (
            <div key={i} className="flex items-start space-x-3">
              <div className="h-8 w-8 rounded-full bg-slate-200"></div>
              <div className="">
                <span className="block text-sm font-medium text-gray-700">Steve Jobs</span>
                <span className="block text-xs font-medium text-gray-500">2시간전</span>
                <p className="mt-[1.5px] text-gray-700">
                  The best mandu restaurant is the one nex to myhouse
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col items-start px-4">
        <textarea
          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:ring-offset-2"
          rows={4}
          placeholder="Answer this question"
        />
        <button className="mt-2 w-full rounded-md border border-transparent bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600 focus:ring-2 focus:ring-orange-600 focus:ring-offset-2">
          Reply
        </button>
      </div>
    </div>
  );
};

export default CommunityPostdetail;
