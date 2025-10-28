export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      <p className="mt-2 text-blue-700 font-medium">Generating README...</p>
    </div>
  );
}
