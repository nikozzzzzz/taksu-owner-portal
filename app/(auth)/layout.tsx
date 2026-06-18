export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      {/* Left: Background Image Panel */}
      <div className="relative hidden w-1/2 lg:flex">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-taksu-forest via-taksu-jungle to-taksu-forest" />
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <span className="font-serif text-lg font-bold text-white">TL</span>
            </div>
            <div>
              <p className="font-serif text-lg font-semibold">Taksu Living</p>
              <p className="text-xs text-white/60 uppercase tracking-widest">Owner Portal</p>
            </div>
          </div>

          {/* Quote */}
          <div className="space-y-4">
            <blockquote className="font-serif text-2xl italic leading-relaxed text-white/90">
              "Transparency builds trust. Trust builds lasting partnerships."
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/20" />
              <p className="text-sm text-white/50">PT Taksu Living Management</p>
              <div className="h-px flex-1 bg-white/20" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { value: '94%', label: 'Avg. Occupancy' },
              { value: '$185', label: 'Avg. ADR' },
              { value: '100%', label: 'Transparency' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-serif text-2xl font-semibold text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form Panel */}
      <div className="flex flex-1 items-center justify-center bg-taksu-cream p-6 lg:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
