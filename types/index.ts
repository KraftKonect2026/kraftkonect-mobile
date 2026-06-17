// types.ts - Add these to your existing types file

// Existing types that should already be defined
export type ResolverFn<TArgs, TResult> = (
  parent: any,
  args: TArgs,
  context: ResolverContext,
  info: any
) => Promise<TResult> | TResult;

export interface ResolverContext {
  token?: string;
  user?: User;
}

// Auth types
export interface AuthPayload {
  accessToken: string | null;
  refreshToken: string | null;
  user: User;
  message?: string; // optional message (e.g., "Account created successfully")
}

export interface SignInMutationArgs {
  email: string;
  password: string;
}

export interface SignUpMutationArgs {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}


// User/Me types
export interface User {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  role: "customer" | "provider" | "admin"; // lowercase to match DB
  avatarUrl: string | null;
  metadata: Record<string, any>;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  phoneVerified: boolean;
  phoneVerifiedAt: string | null;
}

// Listing types
export interface Listing {
  id: string;
  provider_id: string;
  title: string;
  description: string | null;
  price_cents: number;
  duration_minutes: number;
  currency: string;
  category: string;
  photos: any[] | null;
  active: boolean;
  created_at: string;
}

export interface ListingsQueryArgs {
  category?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface CreateListingInput {
  title: string;
  description?: string;
  priceCents: number;
  durationMinutes?: number;
  currency?: string;
  category: string; // THIS WAS MISSING
  photos?: any[];
}

export interface CreateListingMutationArgs {
  input: CreateListingInput;
}

// NEW: Update listing types
export interface UpdateListingInput {
  title?: string;
  description?: string;
  priceCents?: number;
  durationMinutes?: number;
  currency?: string;
  category?: string;
  photos?: any[];
}

export interface UpdateListingMutationArgs {
  id: string;
  input: UpdateListingInput;
}

// Provider types
export interface Provider {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  category: string | null;
  bio: string | null;
  verified: boolean;
  rating: number | null;
  rating_count: number;
  stripe_account_id: string | null;
  created_at: string;
  pricePerHour?: number | null;
  minFee?: number | null;
  maxFee?: number | null;
}

// NEW: Update provider types
export interface UpdateProviderInput {
  status?: "pending" | "approved" | "rejected";
  category?: string;
  bio?: string;
}

export interface UpdateProviderMutationArgs {
  id: string;
  input: UpdateProviderInput;
}

// Booking types
export interface Booking {
  id: string;
  booking_ref?: string;
  listing_id: string;
  customer_id: string;
  provider_id: string;
  booking_date: string; // or starts_at depending on your schema
  total_price_cents: number;
  currency: string;
  status:
    | "pending"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "refunded";
  payment_intent_id?: string;
  notes?: string | null;
  created_at: string;
  clientSecret?: string; // For Stripe payment
}

export interface BookingsForUserQueryArgs {
  status?:
    | "pending"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "refunded";
}

// NEW: Create booking types
export interface CreateBookingInput {
  listingId: string;
  bookingDate: string; // ISO 8601 date string
  notes?: string;
  bidAmount?: number;
}

export interface CreateBookingMutationArgs {
  input: CreateBookingInput;
}

// NEW: Update booking types
export interface UpdateBookingInput {
  status?:
    | "pending"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "refunded";
  notes?: string;
}

export interface UpdateBookingMutationArgs {
  id: string;
  input: UpdateBookingInput;
}
