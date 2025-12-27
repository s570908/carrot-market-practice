import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cls } from "@libs/utils";

interface ActionOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  options: ActionOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  onConfirm: (value: string) => void;
  maxWidth?: string;
}

export default function ActionSheet({
  isOpen,
  onClose,
  title,
  options,
  selectedValue,
  onChange,
  onConfirm,
  maxWidth = "max-w-xl",
}: ActionSheetProps) {
  // Close when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

console.log("ActionSheet rendered with selectedValue:", selectedValue);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Action Sheet */}
          <motion.div
            className={cls(
              "fixed bottom-0 z-50 mx-auto flex w-full flex-col overflow-hidden rounded-t-2xl bg-white",
              maxWidth,
              "left-0 right-0"
            )}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center w-full pt-2 pb-1">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>
            {/* Title */}
            {title && (
              <div className="w-full py-3 text-center border-b border-gray-200">
                <h3 className="text-base font-medium">{title}</h3>
              </div>
            )}
            {/* Options */}
            <div className="flex flex-col w-full">
              {options.map((option) => (
                <label
                  key={option.value}
                  className={cls(
                    "flex cursor-pointer items-center border-b border-gray-100 px-4 py-3",
                    option.disabled ? "cursor-not-allowed text-gray-400" : "",
                    selectedValue === option.value
                      ? "font-bold text-orange-500"
                      : ""
                  )}
                >
                  <input
                    type="radio"
                    name="action-sheet-radio"
                    value={option.value}
                    checked={
                      selectedValue === option.value
                    }
                    disabled={option.disabled}
                    onChange={() => !option.disabled && onChange(option.value)}
                    className="mr-3 accent-orange-500"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <div className="p-4">
              <button
                className="w-full py-3 font-medium text-center text-white bg-orange-500 rounded-xl active:bg-orange-600"
                onClick={() => {
                  onConfirm(selectedValue);
                  onClose();
                }}
                disabled={!selectedValue}
              >
                확인
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
