import type { NextPage } from "next";

const ChatDetail: NextPage = () => {
  return (
    <div>
      <div className="px-4 py-10 space-y-4 border">
        <div className="flex flex-row items-start space-x-2">
          <div className="w-8 h-8 rounded-full bg-slate-400"></div>
          <div className="w-1/2 p-2 text-sm text-gray-700 border border-gray-300 rounded-md ">
            <p>Hi how much are you selling them for?</p>
          </div>
        </div>

        <div className="flex flex-row-reverse items-start space-x-2 space-x-reverse">
          <div className="w-8 h-8 rounded-full bg-slate-400"></div>
          <div className="w-1/2 p-2 text-sm text-gray-700 border border-gray-300 rounded-md ">
            <p>I want ￦20,000</p>
          </div>
        </div>

        <div className="flex flex-row items-start space-x-2">
          <div className="w-8 h-8 rounded-full bg-slate-400"></div>
          <div className="w-1/2 p-2 text-sm text-gray-700 border border-gray-300 rounded-md ">
            <p>Hi how much are you selling them for?</p>
          </div>
        </div>

        <div className="flex flex-row-reverse items-start space-x-2 space-x-reverse">
          <div className="w-8 h-8 rounded-full bg-slate-400"></div>
          <div className="w-1/2 p-2 text-sm text-gray-700 border border-gray-300 rounded-md ">
            <p>I want ￦20,000</p>
          </div>
        </div>

        <div className="flex flex-row items-start space-x-2">
          <div className="w-8 h-8 rounded-full bg-slate-400"></div>
          <div className="w-1/2 p-2 text-sm text-gray-700 border border-gray-300 rounded-md ">
            <p>Hi how much are you selling them for?</p>
          </div>
        </div>

        <div className="flex flex-row-reverse items-start space-x-2 space-x-reverse">
          <div className="w-8 h-8 rounded-full bg-slate-400"></div>
          <div className="w-1/2 p-2 text-sm text-gray-700 border border-gray-300 rounded-md ">
            <p>I want ￦20,000</p>
          </div>
        </div>

        <div className="flex flex-row items-start space-x-2">
          <div className="w-8 h-8 rounded-full bg-slate-400"></div>
          <div className="w-1/2 p-2 text-sm text-gray-700 border border-gray-300 rounded-md ">
            <p>Hi how much are you selling them for?</p>
          </div>
        </div>

        <div className="flex flex-row-reverse items-start space-x-2 space-x-reverse">
          <div className="w-8 h-8 rounded-full bg-slate-400"></div>
          <div className="w-1/2 p-2 text-sm text-gray-700 border border-gray-300 rounded-md ">
            <p>I want ￦20,000</p>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 max-w-md m-0 mx-auto bottom-3">
        <div className="relative flex flex-row items-center border border-blue-500 ">
          <input
            type="text"
            className="w-full border-gray-300 rounded-full shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
          />
          <div className="absolute inset-y-0 right-0  py-1.5 pr-1.5">
            <button className="flex items-center h-full px-3 text-sm text-white bg-orange-500 rounded-full hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
              &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ChatDetail;
