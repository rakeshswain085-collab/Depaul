
type CrestProps = {
  className?: string;
  title?: string;
};

import { SiteImage } from "@/components/site-image-provider";

export function Crest({
  className = "h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24",
  title = "De-Paul School Aska Logo",
}: CrestProps) {
  return (
    <SiteImage
      slot="schoolLogo"
      alt={title}
      className={`${className} shrink-0 object-contain`}
    />
  );
}