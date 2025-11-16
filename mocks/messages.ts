export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  providerId: string;
  providerName: string;
  providerImage: string;
  providerCategory: string;
  bookingId?: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  messages: Message[];
}

export const mockConversations: Conversation[] = [
  {
    id: "1",
    providerId: "1",
    providerName: "Sarah Johnson",
    providerImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    providerCategory: "Cleaning",
    bookingId: "AH-2025-001",
    lastMessage: "I'll be there at 10 AM sharp. See you tomorrow!",
    lastMessageTime: "10:35 AM",
    unread: true,
    messages: [
      {
        id: "1",
        senderId: "customer",
        text: "Hi Sarah, looking forward to the cleaning service tomorrow!",
        timestamp: "10:30 AM",
        read: true,
      },
      {
        id: "2",
        senderId: "1",
        text: "Hi! Yes, I'm all set. Do you have any specific areas you'd like me to focus on?",
        timestamp: "10:32 AM",
        read: true,
      },
      {
        id: "3",
        senderId: "customer",
        text: "The kitchen and bathrooms need the most attention. Also, please use eco-friendly products if possible.",
        timestamp: "10:34 AM",
        read: true,
      },
      {
        id: "4",
        senderId: "1",
        text: "I'll be there at 10 AM sharp. See you tomorrow!",
        timestamp: "10:35 AM",
        read: false,
      },
    ],
  },
  {
    id: "2",
    providerId: "2",
    providerName: "Michael Chen",
    providerImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    providerCategory: "Plumbing",
    bookingId: "AH-2025-002",
    lastMessage: "Perfect, I'll bring all necessary tools",
    lastMessageTime: "Yesterday",
    unread: false,
    messages: [
      {
        id: "1",
        senderId: "customer",
        text: "Hi Michael, the kitchen sink is leaking underneath. Can you help?",
        timestamp: "Yesterday, 2:15 PM",
        read: true,
      },
      {
        id: "2",
        senderId: "2",
        text: "Yes, I can fix that. Is it a constant drip or only when the water is running?",
        timestamp: "Yesterday, 2:18 PM",
        read: true,
      },
      {
        id: "3",
        senderId: "customer",
        text: "It drips constantly, and there's a small puddle forming",
        timestamp: "Yesterday, 2:20 PM",
        read: true,
      },
      {
        id: "4",
        senderId: "2",
        text: "Perfect, I'll bring all necessary tools",
        timestamp: "Yesterday, 2:22 PM",
        read: true,
      },
    ],
  },
  {
    id: "3",
    providerId: "3",
    providerName: "Emily Rodriguez",
    providerImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    providerCategory: "Beauty",
    bookingId: "AH-2025-003",
    lastMessage: "Thank you! Hope you love the new style 💇‍♀️",
    lastMessageTime: "Jan 15",
    unread: false,
    messages: [
      {
        id: "1",
        senderId: "customer",
        text: "The haircut looks amazing! Thank you so much!",
        timestamp: "Jan 15, 12:30 PM",
        read: true,
      },
      {
        id: "2",
        senderId: "3",
        text: "Thank you! Hope you love the new style 💇‍♀️",
        timestamp: "Jan 15, 12:35 PM",
        read: true,
      },
    ],
  },
];
