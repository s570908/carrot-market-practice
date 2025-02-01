import React, { ReactNode } from "react";

interface CustomDotsProps {
  modal: any;
  params: any;
  other: string;
}

const CustomDots: React.FC<CustomDotsProps> = ({ modal, params, other }) => {
  console.log("modal start!");
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <p>{other}</p>
        <div
          className="mb-2"
          onClick={() => {
            // router.push(`/products/${router?.query?.id}/edit`);
            console.log("상품 게시 수정 clicked!");
            console.log("params: ", params);
            modal.closeWithResult(params);
          }}
        >
          상품 게시 수정
        </div>
        <div
          onClick={() => {
            // handleDeleteClick();
            console.log("삭제 clicked!");
            modal.closeWithResult({ message: "rejected" });
            // modal.closeWithError({ message: "rejected" });
          }}
        >
          삭제
        </div>
      </div>
    </div>
  );
};

export default CustomDots;
