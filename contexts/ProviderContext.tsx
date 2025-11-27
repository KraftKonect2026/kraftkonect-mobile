import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useMemo, useState } from "react";

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

interface ProviderContextValue {
  jobs: Job[];
  listings: Listing[];
  earnings: {
    today: number;
    thisWeek: number;
    total: number;
    nextPayout: number;
    nextPayoutDate: string;
  };
  addListing: (listing: Omit<Listing, "id">) => void;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
  updateJobStatus: (jobId: string, status: Job["status"]) => void;
}

export const [ProviderContext, useProvider] = createContextHook<ProviderContextValue>(() => {
  const [jobs, setJobs] = useState<Job[]>([
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
  ]);

  const [listings, setListings] = useState<Listing[]>([
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
  ]);

  const [earnings] = useState({
    today: 205,
    thisWeek: 1240,
    total: 12450,
    nextPayout: 1240,
    nextPayoutDate: "2025-01-20",
  });

  const addListing = useCallback((listing: Omit<Listing, "id">) => {
    const newListing = {
      ...listing,
      id: Date.now().toString(),
    };
    setListings(prev => [...prev, newListing]);
  }, []);

  const updateListing = useCallback((id: string, updates: Partial<Listing>) => {
    setListings(prev => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }, []);

  const deleteListing = useCallback((id: string) => {
    setListings(prev => prev.filter((l) => l.id !== id));
  }, []);

  const updateJobStatus = useCallback((jobId: string, status: Job["status"]) => {
    setJobs(prev => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
  }, []);

  return useMemo(
    () => ({
      jobs,
      listings,
      earnings,
      addListing,
      updateListing,
      deleteListing,
      updateJobStatus,
    }),
    [jobs, listings, earnings, addListing, updateListing, deleteListing, updateJobStatus]
  );
});
