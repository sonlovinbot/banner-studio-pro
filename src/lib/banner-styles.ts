// 5 distinct style variations to apply on top of the user's reference + product
export const BANNER_STYLES = [
  {
    name: "Bold & Vibrant",
    modifier:
      "Bold, vibrant color palette with high-contrast typography. Energetic composition, dynamic angles, modern commercial poster feel.",
  },
  {
    name: "Minimal Editorial",
    modifier:
      "Minimal editorial layout with generous whitespace, refined sans-serif typography, soft neutral palette, premium magazine aesthetic.",
  },
  {
    name: "Luxury Gradient",
    modifier:
      "Luxury feel with smooth gradient background, glossy product hero, gold or pastel accent typography, premium e-commerce banner aesthetic.",
  },
  {
    name: "Playful Pop",
    modifier:
      "Playful pop-art style, geometric shapes, bright pastel colors, fun rounded typography, social media campaign vibe.",
  },
  {
    name: "Cinematic Hero",
    modifier:
      "Cinematic hero composition, dramatic lighting on the product, deep contrast, large display headline, premium brand campaign look.",
  },
] as const;

export function buildPrompt(opts: {
  brand: string;
  userPrompt: string;
  styleModifier: string;
  hasInspiration: boolean;
  hasProduct: boolean;
}) {
  const parts: string[] = [];
  parts.push(
    "Create a professional marketing banner / poster design.",
  );
  if (opts.hasInspiration && opts.hasProduct) {
    parts.push(
      "Use the FIRST reference image(s) as design/style inspiration (layout, composition, typography vibe, color mood). Use the LAST reference image(s) as the actual PRODUCT to feature prominently in the banner — keep the product accurate and recognizable.",
    );
  } else if (opts.hasInspiration) {
    parts.push("Use the reference image(s) as design inspiration.");
  } else if (opts.hasProduct) {
    parts.push("Feature the provided product image prominently and accurately.");
  }
  if (opts.brand.trim()) {
    parts.push(`Brand information to incorporate: ${opts.brand.trim()}`);
  }
  if (opts.userPrompt.trim()) {
    parts.push(`Additional direction: ${opts.userPrompt.trim()}`);
  }
  parts.push(`Style direction: ${opts.styleModifier}`);
  parts.push(
    "Output: a single polished banner. Sharp typography, balanced composition, print-ready quality.",
  );
  return parts.join(" ");
}
