interface Props {
  connected: boolean;
  onClick: any;
}

function ButtonAction({ connected, onClick }: Props) {
  return (
    <div className="flex w-2/12 flex-col items-stretch justify-center pl-2">
      <button
        className="h-full rounded border-2 bg-[#9580ff] px-2 text-sm text-white shadow hover:border-[#9580ff] hover:bg-white hover:text-[#9580ff]"
        onClick={onClick}
        disabled={!connected}
      >
        SEND
      </button>
    </div>
  );
}

export default ButtonAction;
