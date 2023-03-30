import type { NextPage } from "next";

const Upload: NextPage = () => {
  return (
    <div className="px-4 py-16">
      <div className="mt-5">
        <label className="flex h-48 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 py-6 text-gray-600 hover:border-orange-500 hover:text-orange-500">
          {" "}
          <svg
            className="h-12 w-12"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input className="" type="file" />
        </label>
      </div>

      <div className="mt-5">
        <label htmlFor="price" className="mb-1 text-sm font-medium text-gray-700">
          Price
        </label>
        <div className="border-1 relative flex items-center rounded-md border-gray-300">
          <div className="absolute left-0 flex items-center justify-center rounded-md pl-3 ">
            <span className="text-sm text-gray-500">$</span>
          </div>
          <input
            className="appearanc-none mt-1 w-full rounded-md border border-gray-300 py-2 pl-7 pr-14 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            id="price"
            placeholder="0.00"
          />
          <div className="pointer-events-none absolute right-0 flex items-center ">
            <span className="pr-3 text-gray-500">USD</span>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="description" className="text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          rows={4}
          id="description"
          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        />
      </div>
      <button className="mt-5 w-full rounded-md border border-transparent bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600 ">
        Upload product
      </button>
    </div>
  );
};

export default Upload;
