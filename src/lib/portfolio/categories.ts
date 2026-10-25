export const portfolioCategories = [
  { slug: "logo-branding", title: "Logo & Branding", number: "01" },
  { slug: "social-media", title: "Social Media", number: "02" },
  { slug: "advertising-design", title: "Advertising Design", number: "03" },
  { slug: "visual-design", title: "Visual Design", number: "04" },
] as const;

export type PortfolioCategory = (typeof portfolioCategories)[number]["slug"];

export function getPortfolioCategory(slug: string) {
  return portfolioCategories.find((category) => category.slug === slug);
}
