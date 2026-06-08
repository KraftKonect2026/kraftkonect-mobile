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
      available
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
            stripeAccountId
            services {
                id
                title
                description
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
