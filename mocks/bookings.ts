export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

export interface Booking {
  id: string;
  providerId: string;
  providerName: string;
  providerImage: string;
  providerCategory: string;
  providerRating: number;
  serviceName: string;
  date: string;
  time: string;
  address: string;
  cost: number;
  status: BookingStatus;
  bookingId: string;
  notes?: string;
  cancelReason?: string;
  reviewed?: boolean;
}

export const mockBookings: Booking[] = [
  {
    id: "1",
    providerId: "1",
    providerName: "Sarah Johnson",
    providerImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    providerCategory: "Cleaning",
    providerRating: 4.9,
    serviceName: "Deep Home Cleaning",
    date: "2025-01-20",
    time: "10:00 AM",
    address: "123 Oak Street, Downtown",
    cost: 85,
    status: "confirmed",
    bookingId: "AH-2025-001",
    notes: "Please bring eco-friendly cleaning products",
  },
  {
    id: "2",
    providerId: "2",
    providerName: "Michael Chen",
    providerImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    providerCategory: "Plumbing",
    providerRating: 4.8,
    serviceName: "Leak Repair",
    date: "2025-01-18",
    time: "2:00 PM",
    address: "456 Elm Avenue, Westside",
    cost: 120,
    status: "pending",
    bookingId: "AH-2025-002",
    notes: "Kitchen sink is leaking under the counter",
  },
  {
    id: "3",
    providerId: "3",
    providerName: "Emily Rodriguez",
    providerImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    providerCategory: "Beauty",
    providerRating: 5.0,
    serviceName: "Haircut & Styling",
    date: "2025-01-15",
    time: "11:00 AM",
    address: "789 Pine Road, Eastside",
    cost: 65,
    status: "completed",
    bookingId: "AH-2025-003",
    reviewed: false,
  },
  {
    id: "4",
    providerId: "4",
    providerName: "David Martinez",
    providerImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    providerCategory: "Electrical",
    providerRating: 4.7,
    serviceName: "Outlet Installation",
    date: "2025-01-10",
    time: "9:00 AM",
    address: "321 Maple Street, Southside",
    cost: 95,
    status: "completed",
    bookingId: "AH-2025-004",
    reviewed: true,
  },
  {
    id: "5",
    providerId: "5",
    providerName: "Lisa Anderson",
    providerImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    providerCategory: "Painting",
    providerRating: 4.6,
    serviceName: "Room Painting",
    date: "2025-01-05",
    time: "8:00 AM",
    address: "654 Birch Lane, Northside",
    cost: 280,
    status: "cancelled",
    bookingId: "AH-2025-005",
    cancelReason: "Provider unavailable due to emergency",
  },
];
