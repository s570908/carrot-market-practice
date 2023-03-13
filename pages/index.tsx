import type { NextPage } from "next";
import tw from "tailwind-styled-components";

const Container = tw.div`
  grid
  gap-10
  space-y-5
  bg-slate-400
  py-20
  px-20
  min-h-screen
  xl:grid-cols-3
`;

const Home: NextPage = () => {
  return (
    <div className="dark grid min-h-screen gap-10 space-y-5 bg-slate-400 px-20 py-20 lg:grid-cols-2 xl:grid-cols-3 xl:place-content-center">
      <div className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-2xl dark:bg-black">
        <span className="text-3xl font-semibold dark:text-white">Select Item</span>
        <ul>
          {[1, 2].map((i) => (
            <div key={i} className="my-2 flex justify-between">
              <span className="text-gray-500 dark:text-gray-100">Grey Chair</span>
              <span className="font-semibold dark:text-white">$19</span>
            </div>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t-2 border-dashed pt-2">
          <span>Total</span>
          <span className="font-semibold">$10</span>
        </div>
        <button className="mx-auto mt-5 block w-1/2 rounded-xl bg-blue-500 p-5 text-center text-white hover:bg-teal-500 hover:text-black focus:bg-red-500 active:bg-yellow-500 dark:border dark:border-white dark:bg-black dark:hover:bg-white dark:hover:text-black ">
          Checkout
        </button>
      </div>
      <div className="group overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="bg-blue-500 p-6 pb-14 xl:pb-40 portrait:bg-indigo-500 landscape:bg-teal-400">
          <span className="text-2xl text-white">Profile</span>
        </div>
        <div className="group relative -top-5 rounded-3xl bg-white p-6">
          <div className="relative -top-16 flex items-end justify-between">
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500">Orders</span>
              <span className="font-medium">340</span>
            </div>
            <div className="h-24 w-24 rounded-full bg-gray-400 group-hover:bg-red-300"></div>
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500">Spent</span>
              <span className="font-medium">$2,310</span>
            </div>
          </div>
          <div className="-mt-10 -mb-5 flex flex-col items-center">
            <span className="text-lg">Tony Molloy</span>
            <span className="text-sm text-gray-500">미국</span>
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-10 shadow-2xl lg:col-span-2 xl:col-span-1">
        <div className="mb-5 flex items-center justify-between">
          <span>⬅</span>
          <div className="space-x-3">
            <span>⭐️4.9</span>
            <span className="rounded-md p-2 shadow-xl">💖</span>
          </div>
        </div>
        <div className="mb-5 h-72 bg-zinc-400" />
        <div className="flex flex-col">
          <span className="mb-1.5 text-xl font-medium">Swoon Lounge</span>
          <span className="text-xs text-gray-500">Chair</span>
          <div className="mt-3 mb-5 flex items-center justify-between">
            <div className="space-x-2">
              <button className="h-5 w-5 rounded-full bg-yellow-500 bg-opacity-80 ring-yellow-500 ring-offset-1 transition focus:ring-2" />
              <button className="h-5 w-5 rounded-full bg-indigo-500 bg-opacity-80 ring-indigo-500 ring-offset-1 transition focus:ring-2" />
              <button className="h-5 w-5 rounded-full bg-teal-500 bg-opacity-80 ring-teal-500 ring-offset-1 transition focus:ring-2" />
            </div>
            <div className="flex items-center space-x-5">
              <button className="flex aspect-square w-8 items-center justify-center rounded-xl bg-blue-200 text-xl text-gray-500">
                -
              </button>
              <span>1</span>
              <button className="flex aspect-square w-8 items-center justify-center rounded-xl bg-blue-200 text-xl text-gray-500">
                +
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-medium">$450</span>
            <button className="rounded-lg bg-blue-500 px-8 py-2 text-center text-xs text-white">
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

/*

<div className="dark:md:hover:bg-teal-400">
        <h2 className="bg-[url('/vercel.svg')] bg-no-repeat text-[20px] text-[#000]">Hello</h2>
      </div>
      <div className="p-6 bg-white shadow-2xl rounded-2xl dark:bg-black">
        <span className="text-3xl font-semibold dark:text-white">Select Item</span>

        <ul>
          {[1, 2, 3, 4, 5, ""].map((el, index) => (
            <div
              key={index}
              className="flex justify-between my-2 odd:bg-yellow-200 even:bg-blue-100 empty:hidden "
            >
              <span className="text-gray-500 dark:text-gray-500">Grey Chair</span>
              <span className="font-semibold dark:text-gray-500">$19</span>
            </div>
          ))}
        </ul>

        <div className="flex justify-between pt-2 mt-2 border-t-2 border-dashed">
          <span>Total</span>
          <span className="font-semibold">$10</span>
        </div>
        <button className="block w-1/2 p-5 mx-auto mt-5 text-center text-white bg-blue-500 rounded-xl hover:bg-teal-500 hover:text-black focus:bg-red-500 active:bg-yellow-500 dark:border dark:border-white dark:bg-black dark:hover:bg-white dark:hover:text-black">
          Checkout
        </button>
      </div>

      <div className="overflow-hidden border-2 border-gray-600 group rounded-3xl">
        <div className="p-6 bg-blue-500 pb-14">
          <span className="text-2xl text-white">Profile</span>
        </div>

        <div className="relative p-6 bg-white border-2 border-yellow-600 -top-5 rounded-3xl ">
          <div className="relative flex items-end justify-between border-2 border-blue-600 -top-16">
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500">Orders</span>
              <span className="font-medium">340</span>
            </div>
            <div className="w-24 h-24 bg-gray-500 rounded-full group-hover:bg-red-400"></div>
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500">Spent</span>
              <span className="font-medium">$2,310</span>
            </div>
          </div>

          <div className="flex flex-col items-center -mt-10 -mb-5 border-2 border-red-600">
            <span className="text-lg">Tony Molloy</span>
            <span className="text-sm text-gray-500">미국</span>
          </div>
        </div>
      </div>

      <div className="p-10 bg-white shadow-2xl rounded-2xl">
        <div className="flex items-center justify-between mb-5">
          <span>⬅</span>
          <div className="space-x-3">
            <span>⭐️4.9</span>
            <span className="p-2 rounded-md shadow-xl">💖</span>
          </div>
        </div>
        <div className="mb-5 h-72 bg-zinc-400" />
        <div className="flex flex-col">
          <span className="mb-1.5 text-xl font-medium">Swoon Lounge</span>
          <span className="text-xs text-gray-500">Chair</span>
          <div className="flex items-center justify-between mt-3 mb-5">
            <div>
              <input type="radio" />
              <input type="radio" />
              <input type="radio" />
            </div>
            <div className="flex items-center space-x-5">
              <button className="flex items-center justify-center w-8 text-xl text-gray-500 bg-blue-200 aspect-square rounded-xl">
                -
              </button>
              <span>1</span>
              <button className="flex items-center justify-center w-8 text-xl text-gray-500 bg-blue-200 aspect-square rounded-xl">
                +
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-medium">$450</span>
            <button className="px-8 py-2 text-xs text-center text-white bg-blue-500 rounded-lg">
              Add to cart
            </button>
          </div>
        </div>
      </div>

      <div className="p-10 bg-white shadow-2xl rounded-2xl">
        <div className="flex items-center justify-between mb-5 ">
          <span>⬅</span>
          <div className="space-x-3">
            <span>⭐️4.9</span>
            <span className="p-2">💖</span>
          </div>
        </div>
        <div className="mb-5 h-72 bg-zinc-400"></div>
        <div className="flex flex-col">
          <span className="mb-1.5 text-xl font-medium">Swoon Lounge</span>
          <span className="text-xs text-gray-500">Chair</span>
          <div className="flex items-center justify-between mt-3 mb-5">
            <div className="space-x-2">
              <button className="w-5 h-5 transition bg-yellow-500 rounded-full bg-opacity-80 ring-yellow-500 ring-offset-1 focus:ring-2" />
              <button className="w-5 h-5 transition bg-indigo-500 rounded-full bg-opacity-80 ring-indigo-500 ring-offset-1 focus:ring-2" />
              <button className="w-5 h-5 transition bg-teal-500 rounded-full bg-opacity-80 ring-teal-500 ring-offset-1 focus:ring-2" />
            </div>
            <div className="flex items-center justify-center space-x-5">
              <button className="flex items-center justify-center w-8 text-xl text-gray-500 bg-blue-200 aspect-square rounded-xl ">
                -
              </button>
              <span>1</span>
              <button className="flex items-center justify-center w-8 text-xl text-gray-500 bg-blue-200 aspect-square rounded-xl ">
                +
              </button>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-2xl font-medium">$450</span>
            <button className="px-8 py-2 text-xs text-center text-white bg-blue-500 rounded-lg">
              Add to cart
            </button>
          </div>
        </div>
      </div>

      <form className="flex flex-col p-5 space-y-2">
        <input
          type="text"
          required
          placeholder="Username"
          className="p-1 border border-gray-400 rounded-lg peer"
        />
        <span className="hidden peer-invalid:block peer-invalid:text-red-500">
          This input is invalid
        </span>
        <span className="hidden peer-valid:block peer-valid:text-teal-500">Awesome username</span>
        <span className="hidden peer-hover:block peer-hover:text-amber-500">Hello</span>
        <input type="submit" value="Login" className="bg-white"></input>
      </form>

*/
