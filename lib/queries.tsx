import { gql } from "@apollo/client";

export const BOOKINGS_FOR_PROVIDER_QUERY = gql`
  query BookingsForProvider {
    bookingsForProvider {
      id
      bookingRef
      bookingDate
      totalPriceCents
      currency
      status
      notes
      description
      aiParsedSkill
      createdAt
      listing {
        id
        title
        category
      }
      customer {
        id
        name
        phone
        avatarUrl
      }
    }
  }
`

export const MY_PROVIDER_PROFILE_QUERY = gql`
  query MyProviderProfile {
    myProviderProfile {
      id
      status
      available
      gpsEnabled
      categories
      category
      rating
      reviewCount
      avatar
    }
  }
`

export const MY_BLOCKED_DATES_QUERY = gql`
  query MyBlockedDates {
    myBlockedDates
  }
`

export const MY_LISTINGS_QUERY = gql`
  query MyListings {
    myProviderProfile {
      id
      services {
        id
        title
        description
        priceCents
        durationMinutes
        currency
        category
        photos
        active
        createdAt
      }
    }
  }
`

export const GET_DEMAND_FORECAST_QUERY = gql`
  query GetDemandForecast($skill: String!) {
    getDemandForecast(skill: $skill, limit: 6) {
      id
      forecastText
      skill
      area
      weekStart
    }
  }
`

export const USER_PROFILE_QUERY = gql`
    query Me {
        me {
            avatarUrl
            createdAt
            email
            emailVerified
            emailVerifiedAt
            id
            metadata
            name
            phone
            phoneVerified
            phoneVerifiedAt
            role
        }
    }
`

export const PROVIDERS_QUERY = gql`
    query Providers($limit: Int, $offset: Int, $status: ProviderStatus) {
        providers(limit: $limit, offset: $offset, status: $status) {
            avatar
            banner
            bio
            categories
            category
            createdAt
            distance
            experience
            expertise
            gpsEnabled
            id
            name
            portfolio
            pricePerHour
            rating
            ratingCount
            reviewCount
            reviews {
                id
                userId
                rating
                comment
                photos
                userName
                userAvatar
                date
            }
            services {
                id
                title
                description
                priceCents
                durationMinutes
                currency
                category
                photos
                active
                createdAt
            }
            status
            verified
        }
    }
`
export const NEARBY_ARTISANS_QUERY = gql`
  query NearbyArtisans(
    $lat: Float
    $lon: Float
    $skill: String
    $radiusKm: Int
    $neighbourhood: String
  ) {
    nearbyArtisans(
      lat: $lat
      lon: $lon
      skill: $skill
      radiusKm: $radiusKm
      neighbourhood: $neighbourhood
    ) {
      avatar
      banner
      categories
      category
      distanceMeters
      gpsEnabled
      id
      name
      pricePerHour
      experience
      rating
      reviewCount
      verified
    }
  }
`

export const BOOKINGS_FOR_USER_QUERY = gql`
  query BookingsForUser {
    bookingsForUser {
      id
      bookingRef
      bookingDate
      totalPriceCents
      currency
      status
      notes
      description
      createdAt
      listing {
        id
        title
        category
      }
      provider {
        id
        name
        avatar
        rating
        categories
        category
        available
      }
    }
  }
`

export const BOOKING_DETAIL_QUERY = gql`
  query BookingDetail($id: ID!) {
    booking(id: $id) {
      id
      bookingRef
      bookingDate
      totalPriceCents
      currency
      status
      notes
      description
      createdAt
      listing {
        id
        title
        category
      }
      provider {
        id
        name
        avatar
        rating
        categories
        category
        available
      }
    }
  }
`

export const GET_CONVERSATIONS_QUERY = gql`
  query GetConversations {
    getConversations {
      id
      customerId
      providerId
      lastMessage
      lastMessageAt
      unreadCount
      otherParticipant {
        id
        name
        avatar
      }
      createdAt
      updatedAt
    }
  }
`

export const GET_MESSAGES_QUERY = gql`
  query GetMessages($conversationId: ID!) {
    getMessages(conversationId: $conversationId) {
      id
      conversationId
      senderId
      recipientId
      text
      read
      createdAt
    }
  }
`

export const ON_NEW_MESSAGE_SUBSCRIPTION = gql`
  subscription OnNewMessage($conversationId: ID!) {
    onNewMessage(conversationId: $conversationId) {
      id
      conversationId
      senderId
      recipientId
      text
      read
      createdAt
    }
  }
`

export const GET_FAVOURITES_QUERY = gql`
  query GetFavourites {
    favorites {
      id
      name
      avatar
      banner
      categories
      category
      rating
      reviewCount
      pricePerHour
      distance
      distanceMeters
      verified
      experience
      gpsEnabled
    }
  }
`

export const PARSE_JOB_DESCRIPTION_QUERY = gql`
  query ParseJobDescription($description: String!) {
    parseJobDescription(description: $description) {
      skill
      urgency
      suggestedTitle
    }
  }
`

export const PROVIDER_QUERY = gql`
    query Provider($providerId: ID!) {
        provider(id: $providerId) {
            id
            status
            category
            categories
            bio
            verified
            rating
            ratingCount
            reviewCount
            services {
                id
                title
                description
                priceCents
                durationMinutes
                currency
                category
                photos
                active
                createdAt
            }
            createdAt
            name
            avatar
            banner
            experience
            expertise
            portfolio
            pricePerHour
            distance
            available
            blockedDates
            reviews {
                id
                userId
                rating
                comment
                photos
                userName
                userAvatar
                date
            }
        }
    }
`

export const MY_NOTIFICATION_PREFERENCES_QUERY = gql`
  query MyNotificationPreferences {
    myNotificationPreferences {
      bookingUpdates
      newMessages
      promotions
      emailNotifications
      pushNotifications
    }
  }
`

export const MY_PAYOUT_METHOD_QUERY = gql`
  query MyPayoutMethod {
    myPayoutMethod {
      bankName
      bankCode
      accountNumber
      accountName
    }
  }
`

export const MY_PAYOUTS_QUERY = gql`
  query MyPayouts {
    myPayouts {
      id
      amountCents
      status
      createdAt
    }
  }
`

export const BANKS_QUERY = gql`
  query Banks {
    banks {
      name
      code
    }
  }
`

export const RESOLVE_BANK_ACCOUNT_QUERY = gql`
  query ResolveBankAccount($accountNumber: String!, $bankCode: String!) {
    resolveBankAccount(accountNumber: $accountNumber, bankCode: $bankCode) {
      accountNumber
      accountName
    }
  }
`

export const MY_AVAILABLE_BALANCE_QUERY = gql`
  query MyAvailableBalance {
    myAvailableBalance
  }
`
