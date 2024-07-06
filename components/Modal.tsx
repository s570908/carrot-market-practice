import React, { useEffect, useRef } from "react";
import ReactModal from "react-modal";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties; // 스타일 prop 추가
}

// const Modal: React.FC<ModalProps> = ({ isOpen, onRequestClose }) => {
//   return (
//     <ReactModal
//       isOpen={isOpen}
//       onRequestClose={onRequestClose}
//       style={{
//         overlay: {
//           backgroundColor: 'rgba(0, 0, 0, 0)'
//         },
//         content: {
//           top: "10%",
//           left: "70%",
//           right: "auto",
//           bottom: "auto",
//           marginRight: "-50%",
//           transform: "translate(-50%, -50%)",
//           border: "1px solid #ccc",
//           background: "#fff",
//           overflow: "auto",
//           WebkitOverflowScrolling: "touch",
//           borderRadius: "4px",
//           outline: "none",
//           padding: "20px",
//         },
//       }}
//     >
//       <div className="text-lg font-bold">게시글 수정</div>
//       <div>삭제</div>
//     </ReactModal>
//   );
// };

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, style }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 z-20 flex bg-black bg-opacity-0 w-52 top-12" style={style}>
      <div className="p-5 bg-gray-100 rounded-lg" ref={modalRef}>
        {children}
      </div>
    </div>
  );
};

export default Modal;
