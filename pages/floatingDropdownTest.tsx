import React from "react";

export default function FloatingDropdown() {
  return (
    <div className="group relative">
      <button className="fixed bottom-24 right-5 z-20 flex aspect-square w-14 cursor-pointer items-center justify-center rounded-full border-0 border-transparent bg-orange-400 text-white shadow-xl transition-all hover:bg-orange-500 sm:sticky sm:translate-x-[32rem]">
        Menu
      </button>
      <button className="fixed bottom-24 right-5 z-10 flex aspect-square w-14 cursor-pointer items-center justify-center rounded-full border-0  border-transparent bg-orange-400 text-white shadow-xl transition-all hover:bg-orange-500 group-hover:bottom-40  sm:sticky sm:translate-x-[32rem]">
        Prev
      </button>
      <button className="fixed bottom-24 right-5 z-0 flex aspect-square w-14 cursor-pointer items-center justify-center rounded-full  border-0 border-transparent bg-orange-400 text-white shadow-xl transition-all hover:bg-orange-500 group-hover:bottom-56  sm:sticky sm:translate-x-[32rem]">
        Next
      </button>
    </div>
  );
}
