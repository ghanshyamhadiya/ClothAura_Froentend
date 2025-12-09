const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex space-x-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
          style={{
            animation: `wave 1.5s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`
          }}
        ></div>
      ))}
    </div>
    <style jsx="true">{`
      @keyframes wave {
        0%, 60%, 100% { transform: scale(1); opacity: 0.7; }
        30% { transform: scale(1.4); opacity: 1; }
      }
    `}</style>
  </div>
);

export default Loading;