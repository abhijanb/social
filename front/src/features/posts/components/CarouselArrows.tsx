// CarouselArrows – dumb prev/next buttons for PostCarousel. No hooks here.
export default function CarouselArrows({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <>
      <button
        onClick={onPrev}
        aria-label="Previous attachment"
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2.5 py-1 text-sm font-bold text-white hover:bg-black/80"
      >
        ‹
      </button>
      <button
        onClick={onNext}
        aria-label="Next attachment"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2.5 py-1 text-sm font-bold text-white hover:bg-black/80"
      >
        ›
      </button>
    </>
  )
}
