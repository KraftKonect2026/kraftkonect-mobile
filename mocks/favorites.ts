export interface FavoriteProvider {
  id: string;
  name: string;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  pricePerHour: number;
  distance: string;
  verified: boolean;
}

export const mockFavorites: FavoriteProvider[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    category: "Cleaning",
    rating: 4.9,
    reviewCount: 127,
    pricePerHour: 45,
    distance: "2.1 km",
    verified: true,
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    category: "Beauty",
    rating: 5.0,
    reviewCount: 89,
    pricePerHour: 65,
    distance: "3.5 km",
    verified: true,
  },
  {
    id: "6",
    name: "James Wilson",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    category: "Handyman",
    rating: 4.8,
    reviewCount: 156,
    pricePerHour: 55,
    distance: "1.8 km",
    verified: true,
  },
];
