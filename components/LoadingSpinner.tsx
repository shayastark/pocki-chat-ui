export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-panda-green-200 border-t-panda-green-600`} />
  );
}

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-panda-green-50 to-panda-bamboo-50">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse-gentle">🐼</div>
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading Pocki Chat...</p>
      </div>
    </div>
  );
}
