import React from "react";
import { twMerge } from "tailwind-merge"; // tailwind-merge를 사용하면 클래스 충돌을 방지할 수 있습니다

export type ButtonVariant = "primary" | "secondary" | "danger" | "outline" | "light"; // "light" 추가

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  fullWidth?: boolean;
  size?: "small" | "medium" | "large";
}

export const ModButton: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  isLoading = false,
  disabled,
  fullWidth = false,
  size = "medium",
  className,
  ...props
}) => {
  // 기본 버튼 스타일
  const baseClasses =
    "flex items-center justify-center font-medium rounded transition-all focus:outline-none focus:ring-2 focus:ring-offset-2";

  // 크기에 따른 스타일
  const sizeClasses = {
    small: "py-1 px-3 text-sm",
    medium: "py-2 px-4 text-base",
    large: "py-3 px-6 text-lg",
  };

  // 변형에 따른 스타일
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-300 disabled:opacity-60",
    secondary: "bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-300 disabled:opacity-60",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-300 disabled:opacity-60",
    outline:
      "bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-300 disabled:opacity-60",
    light:
      "bg-transparent text-gray-700 hover:bg-gray-100 border border-gray-300 focus:ring-gray-500", // "light" 스타일 추가
  };

  // 너비에 따른 스타일
  const widthClasses = fullWidth ? "w-full" : "w-auto";

  // 버튼 클래스 결합
  const buttonClasses = twMerge(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    widthClasses,
    "disabled:cursor-not-allowed",
    className
  );

  return (
    <button className={buttonClasses} disabled={disabled || isLoading} {...props}>
      {isLoading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-white border-l-transparent border-r-white border-t-white"></div>
      )}
      {children}
    </button>
  );
};

export default ModButton;
