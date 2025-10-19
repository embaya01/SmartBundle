interface LoadingShimmerProps {
  count?: number;
}

const LoadingShimmer = ({ count = 6 }: LoadingShimmerProps) => (
  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="flex animate-pulse flex-col gap-4 rounded-3xl bg-white p-6 shadow-soft"
      >
        <div className="h-5 w-3/4 rounded-full bg-slate-200" />
        <div className="flex flex-wrap gap-2">
          <span className="h-6 w-20 rounded-full bg-slate-200" />
          <span className="h-6 w-16 rounded-full bg-slate-200" />
          <span className="h-6 w-24 rounded-full bg-slate-200" />
        </div>
        <div className="h-8 w-32 rounded-lg bg-slate-200" />
        <div className="mt-auto flex gap-3">
          <span className="h-10 w-24 rounded-full bg-slate-200" />
          <span className="h-10 w-28 rounded-full bg-slate-200" />
        </div>
      </div>
    ))}
  </div>
);

export default LoadingShimmer;
