export default function FixedPhotoBackdrop({
  src,
  overlayClassName,
  attach = "viewport",
}: {
  src: string;
  overlayClassName?: string;
  attach?: "viewport" | "contained";
}) {
  const position = attach === "viewport" ? "fixed" : "absolute";

  return (
    <div className={`pointer-events-none inset-0 z-0 overflow-hidden ${position}`} aria-hidden>
      <img
        src={src}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full min-h-full min-w-full object-cover object-center select-none"
        decoding="async"
        draggable={false}
      />
      {overlayClassName ? (
        <div className={`pointer-events-none absolute inset-0 ${overlayClassName}`} />
      ) : null}
    </div>
  );
}
