import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { JsonLd } from "@/components/seo/JsonLd";

describe("JsonLd (Phase 8, §21/§31)", () => {
  it("sérialise les données dans un <script type=\"application/ld+json\">", () => {
    const { container } = render(<JsonLd data={{ "@type": "GroceryStore", name: "Ramot" }} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(JSON.parse(script!.innerHTML)).toEqual({ "@type": "GroceryStore", name: "Ramot" });
  });

  it("échappe les chaînes contenant '<' pour empêcher une injection de balise fermante <\\/script> (sécurité §35)", () => {
    const { container } = render(<JsonLd data={{ name: "</script><script>alert(1)</script>" }} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script!.innerHTML).not.toContain("</script><script>");
    expect(script!.innerHTML).toContain("\\u003c");
    // Le JSON reste valide et restitue la valeur d'origine une fois reparsé.
    expect(JSON.parse(script!.innerHTML).name).toBe("</script><script>alert(1)</script>");
  });
});
