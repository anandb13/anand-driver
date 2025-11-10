export default function AuthIllustration() {
  return (
    <div className="hidden md:flex flex-col justify-center px-10 py-12 bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 font-semibold">
          AD
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-2">Welcome to Anand Drive</h2>
      <p className="text-sm text-indigo-100/90 mb-6">
        Securely store and share your files.
      </p>

      <div className="mt-auto">
        <div className="w-full h-40 rounded-xl bg-white/10 flex items-center justify-center">
          <svg width="140" height="80" fill="none">
            <rect x="8" y="18" width="124" height="44" rx="8" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
            <circle cx="34" cy="40" r="8" fill="rgba(255,255,255,0.14)" />
            <rect x="56" y="30" width="64" height="4" rx="2" fill="rgba(255,255,255,0.14)" />
            <rect x="56" y="40" width="64" height="4" rx="2" fill="rgba(255,255,255,0.08)" />
          </svg>
        </div>
      </div>
    </div>
  );
}
