
type CrestProps = {
  className?: string;
  title?: string;
};

/**
 * De-Paul School Aska official logo.
 * Image location: public/images/school-logo.png
 */
export function Crest({
  className = "h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24",
  title = "De-Paul School Aska Logo",
}: CrestProps) {
  return (
    <img
      src="/images/school-logo.png"
      alt={title}
      title={title}
      className={`${className} shrink-0 object-contain`}
      draggable={false}
    />
  );
}