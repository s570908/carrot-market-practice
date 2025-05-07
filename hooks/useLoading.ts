import { useState, useEffect } from 'react';

export function useLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return {
    isLoading,
    setIsLoading,
    isMounted
  };
}
