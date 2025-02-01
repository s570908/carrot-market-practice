import React, { useRef, useState, ReactNode } from "react";

interface ModalAPI {
  isVisible: boolean;
  closeWithError: (error: any) => void;
  closeWithResult: (result: any) => void;
}

interface PromiseRef {
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
  params: any;
}

export const useAwaitableModal = (
  renderModal: (modal: ModalAPI, params: any) => ReactNode
) => {
  const [isVisible, setIsVisible] = useState(false);

  const promiseRef = useRef<PromiseRef>({
    resolve: () => {},
    reject: () => {},
    params: {},
  });

  const renderModalWithParamsAndContext = () => {
    const closeWithError = (error: any) => {
      promiseRef.current.reject(error);
      setIsVisible(false);
    };

    const closeWithResult = (result: any) => {
      promiseRef.current.resolve(result);
      setIsVisible(false);
    };

    const modalAPI: ModalAPI = {
      isVisible,
      closeWithError,
      closeWithResult,
    };

    return isVisible ? (
      <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          {renderModal(modalAPI, promiseRef.current.params)}
        </div>
      </div>
    ) : null;
  };

  const openModal = (params: any) => {
    return new Promise<any>((resolve, reject) => {
      promiseRef.current = {
        resolve,
        reject,
        params,
      };
      setIsVisible(true);
    });
  };

  return {
    openModal,
    renderModal: renderModalWithParamsAndContext,
  };
};
