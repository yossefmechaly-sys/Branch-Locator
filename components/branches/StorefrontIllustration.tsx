import Image from "next/image";

import storefront from "@/assets/maayan-storefront.png";

/** Artwork extracted from the approved mockup, with the sign baked into the image. */
export function StorefrontIllustration() {
  return (
    <Image
      src={storefront}
      alt=""
      aria-hidden="true"
      sizes="(max-width: 767px) 65vw, (max-width: 1500px) 40vw, 600px"
      loading="eager"
      className="h-auto w-full"
    />
  );
}
