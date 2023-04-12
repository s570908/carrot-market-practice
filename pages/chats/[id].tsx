import Message from "@components/Message";
import type { NextPage } from "next";

const ChatDetail: NextPage = () => {
  return (
    <div className="space-y-4 px-4 py-10">
      <Message message="Hi how much are you selling them for?" />
      <Message message="I want ￦20,000" reversed />
      <Message message="Hi how much are you selling them for?" />
      <Message message="I want ￦20,000" reversed />{" "}
      <Message message="Hi how much are you selling them for?" />
      <Message message="I want ￦20,000" reversed />{" "}
      <Message message="Hi how much are you selling them for?" />
      <Message message="I want ￦20,000" reversed />{" "}
      <Message message="Hi how much are you selling them for?" />
      <Message message="I want ￦20,000" reversed />{" "}
      <Message message="Hi how much are you selling them for?" />
      <Message message="I want ￦20,000" reversed />{" "}
      <Message message="Hi how much are you selling them for?" />
      <Message message="I want ￦20,000" reversed />{" "}
      <Message message="Hi how much are you selling them for?" />
      <Message message="I want ￦20,000" reversed />{" "}
      <Message message="Hi how much are you selling them for?" />
      <Message message="I want ￦20,000" reversed />{" "}
      <Message message="Hi how much are you selling them for?" />
      <Message message="I want ￦20,000" reversed />{" "}
      <Message message="Hi how much are you selling them for?" />
      <Message message="I want ￦20,000" reversed />
      <form className="fixed inset-x-0 bottom-3 m-0 mx-auto w-full max-w-md">
        <div className="relative flex items-center">
          <input
            type="text"
            className="w-full rounded-full border-gray-300 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 "
          />
          <div className="absolute inset-y-0 right-0 py-1.5 pr-1.5">
            <button className="flex h-full items-center rounded-full bg-orange-500 px-3 text-sm text-white hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
              &rarr;
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatDetail;
