// Canonical service categories — these slugs MUST match the backend seed
// (src/db/seed.ts) so customer filters line up with how providers register.
export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const categories: Category[] = [
  { id: "plumbing", name: "Plumbing", icon: "droplet" },
  { id: "electrical", name: "Electrical", icon: "zap" },
  { id: "carpentry", name: "Carpentry", icon: "hammer" },
  { id: "painting", name: "Painting", icon: "paintbrush" },
  { id: "tiling", name: "Tiling", icon: "grid" },
  { id: "aircon", name: "Air Conditioning", icon: "wind" },
  { id: "security", name: "Security", icon: "lock" },
  { id: "cleaning", name: "Cleaning", icon: "sparkles" },
  { id: "generator", name: "Generator", icon: "power" },
  { id: "general", name: "General", icon: "wrench" },
];
