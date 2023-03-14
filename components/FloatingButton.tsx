interface FloatingButton {
  children: React.ReactNode;
}

const FloatingButton = ({ children }: FloatingButton) => {
  return (
    <button className="fixed bottom-24 right-5 cursor-pointer rounded-full bg-orange-400 p-4 text-white shadow-xl transition-colors duration-300 hover:bg-orange-500">
      {children}
    </button>
  );
};

export default FloatingButton;
