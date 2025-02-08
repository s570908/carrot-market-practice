interface PostOptionsModalProps {
  postId: string | string[] | undefined;
  onEdit: () => void;
  onClose: (result: string) => void;
}

const PostOptionsModal = ({
  postId,
  onEdit,
  onClose,
}: PostOptionsModalProps) => {
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0"
        onClick={() => onClose("backdrop_click")}
      />
      <div className="relative mx-auto max-w-xl">
        <div className="absolute right-0 top-0 w-40 rounded-lg bg-white p-2 shadow-lg">
          <button
            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
            onClick={() => {
              onEdit();
              onClose("게시글 수정");
            }}
          >
            게시글 수정
          </button>
          <button
            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
            onClick={() => onClose("끌어올리기")}
          >
            끌어올리기
          </button>
          <button
            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
            onClick={() => onClose("숨기기")}
          >
            숨기기
          </button>
          <button
            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
            onClick={() => onClose("삭제")}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostOptionsModal;
