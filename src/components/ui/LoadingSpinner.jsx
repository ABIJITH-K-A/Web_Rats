export const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#08090C] flex items-center justify-center">
    <div className="relative">
      <div className="w-12 h-12 border-2 border-cyan-primary/20 border-t-cyan-primary rounded-full animate-spin" />
    </div>
  </div>
);

export default LoadingSpinner;
