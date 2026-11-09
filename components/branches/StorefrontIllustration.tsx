import Image from "next/image";

import storefront from "@/assets/storefront.png";

/** Artwork adapted from the approved mockup, with an unbranded sign. */
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
