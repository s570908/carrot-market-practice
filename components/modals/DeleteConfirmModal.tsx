interface DeleteConfirmModalProps {
  onClose: (result: string) => void;
}

const DeleteConfirmModal = ({ onClose }: DeleteConfirmModalProps) => {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => onClose("backdrop_click")}
      />
      <div className="z-30 rounded-lg bg-white p-6 text-center">
        <div className="flex flex-col items-center justify-center">
          <p>정말 삭제하시겠습니까?</p>
          <div className="mt-4 flex">
            <button
              className="mr-2 w-[70px] flex-1 rounded-md bg-gray-400"
              onClick={() => onClose("삭제 취소됨")}
            >
              취소
            </button>
            <button
              className="w-[70px] flex-1 rounded-md bg-orange-500"
              onClick={() => onClose("삭제됨")}
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
