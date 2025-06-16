import React from "react";

interface LoadingScreenProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "로딩 중...", 
  size = 'medium',
  fullScreen = true 
}) => {
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-16 h-16", 
    large: "w-24 h-24"
  };

  const containerClasses = fullScreen 
    ? "fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-4">
        {/* 스피너 */}
        <div className={`${sizeClasses[size]} border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin`}></div>
        
        {/* 로딩 메시지 */}
        <p className="text-lg font-medium text-gray-700 animate-pulse">
          {message}
        </p>
        
        {/* 점 애니메이션 */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
