import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Job {
  id: string;
  customerName: string;
  customerPhoto?: string;
  service: string;
  category: string;
  date: string;
  time: string;
  price: number;
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
  address: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  pricePerHour: number;
  duration: number;
  visible: boolean;
  photos: string[];
}

interface ProviderState {
  jobs: Job[];
  listings: Listing[];
  earnings: {
    today: number;
    thisWeek: number;
    total: number;
    nextPayout: number;
    nextPayoutDate: string;
  };
}

const initialState: ProviderState = {
  jobs: [
    {
      id: "1",
      customerName: "Sarah Johnson",
      service: "Home Cleaning",
      category: "Cleaning",
      date: "2025-01-15",
      time: "10:00 AM",
      price: 85,
      status: "confirmed",
      address: "123 Main St, Apt 4B",
    },
    {
      id: "2",
      customerName: "Michael Chen",
      service: "Electrical Repair",
      category: "Electrical",
      date: "2025-01-15",
      time: "2:00 PM",
      price: 120,
      status: "confirmed",
      address: "456 Oak Avenue",
    },
    {
      id: "3",
      customerName: "Emma Wilson",
      service: "Kitchen Plumbing",
      category: "Plumbing",
      date: "2025-01-16",
      time: "11:00 AM",
      price: 95,
      status: "pending",
      address: "789 Pine Road",
    },
  ],
  listings: [
    {
      id: "1",
      title: "Professional Home Cleaning",
      description: "Deep cleaning service for homes and apartments",
      category: "Cleaning",
      pricePerHour: 45,
      duration: 2,
      visible: true,
      photos: [],
    },
    {
      id: "2",
      title: "Electrical Installation & Repair",
      description: "Licensed electrician with 10 years experience",
      category: "Electrical",
      pricePerHour: 65,
      duration: 1,
      visible: true,
      photos: [],
    },
  ],
  earnings: {
    today: 205,
    thisWeek: 1240,
    total: 12450,
    nextPayout: 1240,
    nextPayoutDate: "2025-01-20",
  },
};

const providerSlice = createSlice({
  name: "provider",
  initialState,
  reducers: {
    addListing: (state, action: PayloadAction<Omit<Listing, "id">>) => {
      const newListing = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.listings.push(newListing);
    },
    updateListing: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Listing> }>
    ) => {
      const { id, updates } = action.payload;
      const listing = state.listings.find((l) => l.id === id);
      if (listing) {
        Object.assign(listing, updates);
      }
    },
    deleteListing: (state, action: PayloadAction<string>) => {
      state.listings = state.listings.filter((l) => l.id !== action.payload);
    },
    updateJobStatus: (
      state,
      action: PayloadAction<{ jobId: string; status: Job["status"] }>
    ) => {
      const { jobId, status } = action.payload;
      const job = state.jobs.find((j) => j.id === jobId);
      if (job) {
        job.status = status;
      }
    },
  },
});

export const { addListing, updateListing, deleteListing, updateJobStatus } =
  providerSlice.actions;
export default providerSlice.reducer;
