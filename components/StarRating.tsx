import React from "react";

interface StarRatingProps {
  score: number;
  showScore?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  totalStars?: number; // 총 별 개수를 지정하는 prop 추가
}

const StarRating: React.FC<StarRatingProps> = ({
  score = 0,
  showScore = true,
  size = "md",
  totalStars = 5, // 기본값은 5
}) => {
  // 별 크기에 따른 스타일 설정
  const starSize = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-7 w-7",
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center">
        {Array.from({ length: totalStars }, (_, index) => {
          // score를 totalStars 기준으로 계산 (5점 만점 기준으로 표현)
          const fillPercentage = Math.max(0, Math.min(100, (score - index) * 100));

          return (
            <div key={index} className={`relative inline-block ${starSize[size]}`}>
              {/* 회색 별 */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full text-gray-300">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>

              {/* 노란색 별 */}
              {fillPercentage > 0 && (
                <div
                  className="absolute left-0 top-0 h-full overflow-hidden"
                  style={{
                    clipPath: `inset(0 ${100 - fillPercentage}% 0 0)`,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-full w-full text-yellow-400"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showScore && score > 0 && (
        <span className="font-normal text-gray-600">({score.toFixed(1)})</span>
      )}
    </div>
  );
};

export default StarRating;
