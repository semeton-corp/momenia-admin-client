export function PhoneMockup({ thumbnail }: { thumbnail: string | null }) {
  return (
    <div className="relative mx-auto w-32 aspect-9/18">
      {/* Phone frame */}
      <div className="relative rounded-4xl border-[3px] border-foreground/80 bg-foreground/80 shadow-md overflow-hidden w-full h-full">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 h-4 w-16 rounded-b-xl bg-foreground/80" />
        {/* Screen */}
        <div className="absolute inset-0.5 rounded-[17px] overflow-hidden bg-muted">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt="Template preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-muted">
              <svg className="h-8 w-8 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        {/* View Template overlay button */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[80%]">
          <div className="rounded border border-foreground/30 bg-background/80 py-1 text-center text-[9px] font-medium text-foreground/70 backdrop-blur-sm">
            View Template
          </div>
        </div>
      </div>
    </div>
  )
}
