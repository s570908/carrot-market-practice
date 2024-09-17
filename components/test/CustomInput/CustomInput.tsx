import React from "react";

interface Props {
  inputRef: any;
  msg: string;
  connected: boolean;
  onChange: any;
  onKeyPress: any;
}

function CustomInput({ inputRef, msg, connected, onChange, onKeyPress }: Props) {
  return (
    <div className="flex-1 pr-2">
      <input
        ref={inputRef}
        type="text"
        value={msg}
        placeholder={connected ? "Type a message..." : "Connecting..."}
        className="h-full w-full rounded border-2 border-[#9580ff] px-1 hover:border-[#8aff80] focus:border-[#80ffea] focus:outline-none"
        disabled={!connected}
        onChange={onChange}
        onKeyPress={onKeyPress}
      />
    </div>
  );
}

export default CustomInput;
