import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Booking } from "@/types";

export interface Job {
  id: string;
  customerName: string;
  customerPhoto?: string;
  service: string;
  category: string;
  date: string;
  time: string;
  price: number;
  status: Booking["status"];
  address: string;
  currency: string;
  created_at: string;
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

export interface ProviderState {
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
  jobs: [],
  listings: [],
  earnings: {
    today: 0,
    thisWeek: 0,
    total: 0,
    nextPayout: 0,
    nextPayoutDate: "",
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
