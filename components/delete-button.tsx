import Loading from "@components/Loading";

interface DeleteButtonProps {
  onClick: () => any;
  text: string;
  style?: string;
  loading?: boolean;
}

const DeleteButton = ({ onClick, text, style, loading }: DeleteButtonProps) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`${style} absolute right-0 h-[30px] cursor-pointer rounded-md border px-2 py-1.5 text-xs text-gray-400 hover:bg-gray-50`}
    >
      <span className="flex items-center">
        {loading === true ? <Loading color="orange" size={12} /> : text}
      </span>
    </button>
  );
};

export default DeleteButton;
