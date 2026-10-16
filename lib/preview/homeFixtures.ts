import type { HomeJob, ProviderCardData } from "@/lib/homeData";

// Figma's illustrative people, work and amounts belong exclusively to the dev preview.
export const previewProviders: ProviderCardData[] = [
  { id: "preview-amara", name: "Amara Cleaning", service: "Deep home cleaning", rating: 4.8, startingPrice: "₦15,000", image: require("@/assets/design/631d0.png") },
  { id: "preview-kola-repairs", name: "Kola Repairs", service: "Plumbing repair", rating: 4.9, startingPrice: "₦18,000", image: require("@/assets/design/eba1f.png") },
  { id: "preview-coolair", name: "CoolAir Services", service: "AC servicing", rating: 4.8, startingPrice: "₦20,000", image: require("@/assets/design/c73f3.png") },
  { id: "preview-kola-electric", name: "Kola Electric", service: "Electrical repairs", rating: 4.8, startingPrice: "₦18,000", image: require("@/assets/design/77163.png") },
];
export const previewJobs: HomeJob[] = [
  { id: "preview-job-1", title: "Plumbing repair", customer: "John Snow", date: "Today", address: "12 Admiralty Way, Lekki", image: require("@/assets/design/1b9df.png") },
  { id: "preview-job-2", title: "Bathroom pipe repair", customer: "Terry Jon", date: "Sep 12", address: "123 Chiey Way, Ajah", image: require("@/assets/design/1b9df.png") },
];
export const previewRequests: HomeJob[] = [
  { id: "preview-request-1", title: "Plumbing repair", customer: "James Gun", date: "Sep 14", address: "Ikoyi, Lagos", description: "Water leaks under the cabinet when the tap is on.", avatar: require("@/assets/design/2cea7.jpg") },
];
