export const handleLoadingAndError = (isLoading: boolean, isError: boolean, error: unknown) => {
  if (isLoading) return <div>Loading...</div>;
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return <div>Error: {errorMessage}</div>;
  }
  return null;
};
