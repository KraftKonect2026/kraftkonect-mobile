export interface Provider {
  id: string;
  name: string;
  avatar: string;
  banner: string;
  rating: number;
  reviewCount: number;
  pricePerHour: number;
  distance: number;
  categories: string[];
  bio: string;
  experience: string;
  verified: boolean;
  expertise: string[];
  services: Service[];
  portfolio: string[];
  reviews: Review[];
}

export interface Service {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  images?: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const categories: Category[] = [
  { id: "cleaning", name: "Cleaning", icon: "sparkles" },
  { id: "electrical", name: "Electrical", icon: "zap" },
  { id: "plumbing", name: "Plumbing", icon: "droplet" },
  { id: "painting", name: "Painting", icon: "paintbrush" },
  { id: "handyman", name: "Handyman", icon: "wrench" },
  { id: "beauty", name: "Beauty", icon: "scissors" },
  { id: "carpentry", name: "Carpentry", icon: "hammer" },
  { id: "landscaping", name: "Landscaping", icon: "leaf" },
];

export const providers: Provider[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    banner: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
    rating: 4.9,
    reviewCount: 127,
    pricePerHour: 45,
    distance: 1.2,
    categories: ["cleaning"],
    bio: "Professional cleaner with 8+ years of experience. Eco-friendly products, attention to detail.",
    experience: "8 years",
    verified: true,
    expertise: ["Deep Cleaning", "Eco-Friendly", "Move-in/Move-out"],
    services: [
      {
        id: "s1",
        title: "Deep House Cleaning",
        description: "Complete deep cleaning of your entire home",
        duration: 180,
        price: 120,
      },
      {
        id: "s2",
        title: "Basic Cleaning",
        description: "Regular maintenance cleaning",
        duration: 120,
        price: 80,
      },
    ],
    portfolio: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
      "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800",
      "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800",
    ],
    reviews: [
      {
        id: "r1",
        userId: "u1",
        userName: "Mike Chen",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        rating: 5,
        comment: "Sarah did an amazing job! My house has never been cleaner. Highly recommend!",
        date: "2024-01-15",
      },
      {
        id: "r2",
        userId: "u2",
        userName: "Emily Davis",
        userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
        rating: 5,
        comment: "Very professional and thorough. Will definitely book again!",
        date: "2024-01-10",
      },
    ],
  },
  {
    id: "2",
    name: "James Martinez",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    banner: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800",
    rating: 4.8,
    reviewCount: 93,
    pricePerHour: 75,
    distance: 2.1,
    categories: ["electrical"],
    bio: "Licensed electrician specializing in residential and commercial electrical work.",
    experience: "12 years",
    verified: true,
    expertise: ["Wiring", "Panel Upgrades", "Smart Home"],
    services: [
      {
        id: "s3",
        title: "Electrical Inspection",
        description: "Complete electrical system inspection",
        duration: 90,
        price: 100,
      },
      {
        id: "s4",
        title: "Outlet Installation",
        description: "Install new electrical outlets",
        duration: 60,
        price: 75,
      },
    ],
    portfolio: [
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800",
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800",
    ],
    reviews: [
      {
        id: "r3",
        userId: "u3",
        userName: "Lisa Wang",
        userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
        rating: 5,
        comment: "James was punctual and fixed the issue quickly. Very knowledgeable!",
        date: "2024-01-12",
      },
    ],
  },
  {
    id: "3",
    name: "David Thompson",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    banner: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800",
    rating: 4.7,
    reviewCount: 81,
    pricePerHour: 60,
    distance: 3.5,
    categories: ["plumbing"],
    bio: "Expert plumber providing quick and reliable plumbing solutions.",
    experience: "10 years",
    verified: true,
    expertise: ["Leak Repair", "Pipe Installation", "Emergency Service"],
    services: [
      {
        id: "s5",
        title: "Leak Repair",
        description: "Fix leaking faucets and pipes",
        duration: 90,
        price: 90,
      },
      {
        id: "s6",
        title: "Drain Cleaning",
        description: "Clear clogged drains",
        duration: 60,
        price: 70,
      },
    ],
    portfolio: [
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800",
    ],
    reviews: [
      {
        id: "r4",
        userId: "u4",
        userName: "John Smith",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        rating: 5,
        comment: "Fixed my leak in no time. Great service!",
        date: "2024-01-08",
      },
    ],
  },
  {
    id: "4",
    name: "Maria Garcia",
    avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400",
    banner: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800",
    rating: 5.0,
    reviewCount: 156,
    pricePerHour: 55,
    distance: 1.8,
    categories: ["painting"],
    bio: "Professional painter transforming spaces with color and creativity.",
    experience: "9 years",
    verified: true,
    expertise: ["Interior Painting", "Exterior Painting", "Color Consultation"],
    services: [
      {
        id: "s7",
        title: "Room Painting",
        description: "Paint a single room",
        duration: 240,
        price: 200,
      },
      {
        id: "s8",
        title: "Color Consultation",
        description: "Get expert color advice",
        duration: 60,
        price: 50,
      },
    ],
    portfolio: [
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800",
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800",
    ],
    reviews: [
      {
        id: "r5",
        userId: "u5",
        userName: "Alex Brown",
        userAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
        rating: 5,
        comment: "Maria did an incredible job painting our living room. Perfect finish!",
        date: "2024-01-14",
      },
    ],
  },
  {
    id: "5",
    name: "Robert Wilson",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
    banner: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800",
    rating: 4.6,
    reviewCount: 74,
    pricePerHour: 50,
    distance: 4.2,
    categories: ["handyman"],
    bio: "Versatile handyman ready to tackle any home repair or improvement project.",
    experience: "7 years",
    verified: false,
    expertise: ["Home Repairs", "Furniture Assembly", "TV Mounting"],
    services: [
      {
        id: "s9",
        title: "Furniture Assembly",
        description: "Assemble flat-pack furniture",
        duration: 90,
        price: 75,
      },
      {
        id: "s10",
        title: "TV Wall Mounting",
        description: "Mount your TV on the wall",
        duration: 60,
        price: 80,
      },
    ],
    portfolio: [
      "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800",
    ],
    reviews: [
      {
        id: "r6",
        userId: "u6",
        userName: "Sophie Turner",
        userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
        rating: 5,
        comment: "Robert assembled my IKEA furniture perfectly. Very efficient!",
        date: "2024-01-11",
      },
    ],
  },
  {
    id: "6",
    name: "Emma Anderson",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
    banner: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
    rating: 4.9,
    reviewCount: 201,
    pricePerHour: 65,
    distance: 2.8,
    categories: ["beauty"],
    bio: "Certified beautician offering premium beauty services in the comfort of your home.",
    experience: "11 years",
    verified: true,
    expertise: ["Haircuts", "Coloring", "Makeup"],
    services: [
      {
        id: "s11",
        title: "Haircut & Styling",
        description: "Professional haircut and styling",
        duration: 90,
        price: 85,
      },
      {
        id: "s12",
        title: "Makeup Application",
        description: "Full face makeup for any occasion",
        duration: 60,
        price: 75,
      },
    ],
    portfolio: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800",
    ],
    reviews: [
      {
        id: "r7",
        userId: "u7",
        userName: "Rachel Green",
        userAvatar: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400",
        rating: 5,
        comment: "Emma is amazing! Best haircut I've ever had. So convenient to have it done at home.",
        date: "2024-01-13",
      },
    ],
  },
];
