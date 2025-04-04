import React from "react";
import Link from "next/link";

interface EmptyStateProps {
  message: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionLink?: string;
  onClick?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  description,
  icon,
  actionLabel,
  actionLink,
  onClick,
}) => {
  return (
    <div className="flex h-full min-h-[300px] w-full flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
      {icon ? (
        <div className="mb-4">{icon}</div>
      ) : (
        <div className="mb-4 h-16 w-16 rounded-full bg-gray-200 p-3 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-full w-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900">{message}</h3>
      {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
      {actionLabel && (
        <>
          {actionLink ? (
            <Link href={actionLink}>
              <a className="mt-6 inline-flex items-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                {actionLabel}
              </a>
            </Link>
          ) : (
            <button
              onClick={onClick}
              className="mt-6 inline-flex items-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              {actionLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default EmptyState;
