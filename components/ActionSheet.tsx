import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cls } from "@libs/utils"; // Import the cls utility

interface ActionOption {
  label: string;
  onClick: () => void;
  color?: "default" | "danger";
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  options: ActionOption[];
  maxWidth?: string; // Added max width prop for controlling the sheet width
}

export default function ActionSheet({ 
  isOpen, 
  onClose, 
  title, 
  options,
  maxWidth = "max-w-xl" // Default to content-width (matches Layout)
}: ActionSheetProps) {
  // Close when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
                "fixed bottom-0 z-50 overflow-hidden bg-white rounded-t-2xl",
                "flex flex-col",
                "w-full mx-auto", // Base width and centering
                maxWidth, // Use the provided maxWidth (default or custom)
                "left-0 right-0" // Center with layout content
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
              {options.map((option, index) => (
                <button
                  key={index}
                  className={`py-4 text-center text-base font-medium border-b border-gray-100 active:bg-gray-100 ${
                    option.color === "danger" ? "text-red-500" : "text-gray-800"
                  }`}
                  onClick={() => {
                    option.onClick();
                    onClose();
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {/* Cancel Button */}
            <div className="p-4">
              <button
                className="w-full py-3 font-medium text-center bg-gray-100 rounded-xl active:bg-gray-200"
                onClick={onClose}
              >
                취소
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
