import { gql } from "@apollo/client";

export const SIGN_IN_MUTATION = gql`
  mutation SignIn($email: String!, $password: String!) {
    signIn(email: $email, password: $password) {
      accessToken
      refreshToken
      user {
        email
        createdAt
        avatarUrl
        id
        metadata
        name
        phone
        role
      }
    }
  }
`;

export const SIGN_UP_MUTATION = gql`
  mutation SignUp(
    $email: String!
    $password: String!
    $name: String
    $phone: String
  ) {
    signUp(email: $email, password: $password, name: $name, phone: $phone) {
      accessToken
      refreshToken
      user {
        id
        email
        name
        phone
        role
        avatarUrl
        metadata
        createdAt
      }
    }
  }
`;

export const VERIFY_EMAIL_MUTATION = gql`
  mutation VerifyEmail($email: String!, $otp: String!) {
    verifyEmail(email: $email, otp: $otp) {
      accessToken
      message
      refreshToken
      user {
        id
        email
        name
        phone
        role
        avatarUrl
        metadata
        createdAt
      }
    }
  }
`;

export const RESEND_OTP_MUTATION = gql`
  mutation ResendOtp($email: String!) {
    resendOtp(email: $email) {
      success
      message
    }
  }
`;

export const ONBOARD_PROVIDER_MUTATION = gql`
  mutation OnboardProvider($input: OnboardProviderInput!) {
    onboardProvider(input: $input) {
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
      status
      verified
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(token: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;

export const SET_AVAILABILITY_MUTATION = gql`
  mutation SetAvailability($available: Boolean!) {
    setAvailability(available: $available) {
      id
      available
    }
  }
`;

export const UPDATE_BOOKING_MUTATION = gql`
  mutation UpdateBooking($id: ID!, $status: BookingStatus!) {
    updateBooking(id: $id, input: { status: $status }) {
      id
      status
    }
  }
`;

export const REQUEST_PHONE_OTP_MUTATION = gql`
  mutation RequestPhoneOTP($phone: String!) {
    requestPhoneOTP(phone: $phone) {
      pinId
      message
    }
  }
`;

export const VERIFY_PHONE_OTP_MUTATION = gql`
  mutation VerifyPhoneOTP($phone: String!, $pin: String!, $pinId: String!) {
    verifyPhoneOTP(phone: $phone, pin: $pin, pinId: $pinId) {
      accessToken
      refreshToken
      user {
        id
        name
        phone
        role
        status
      }
    }
  }
`;

export const UPDATE_PROVIDER_LOCATION_MUTATION = gql`
  mutation UpdateProviderLocation($lat: Float, $lon: Float, $enabled: Boolean!) {
    updateProviderLocation(lat: $lat, lon: $lon, enabled: $enabled) {
      id
      gpsEnabled
    }
  }
`;

export const CREATE_REVIEW_MUTATION = gql`
  mutation CreateReview(
    $bookingId: ID!
    $rating: Int!
    $comment: String!
    $photos: [String!]
  ) {
    createReview(
      bookingId: $bookingId
      rating: $rating
      comment: $comment
      photos: $photos
    ) {
      id
      rating
      comment
      createdAt
    }
  }
`;

export const ADD_TO_FAVOURITES_MUTATION = gql`
  mutation AddToFavourites($providerId: ID!) {
    addToFavorites(providerId: $providerId) {
      id
      providerId
    }
  }
`;

export const REMOVE_FROM_FAVOURITES_MUTATION = gql`
  mutation RemoveFromFavourites($providerId: ID!) {
    removeFromFavorites(providerId: $providerId)
  }
`;

export const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($recipientId: ID!, $text: String!) {
    sendMessage(recipientId: $recipientId, text: $text) {
      id
      conversationId
      senderId
      recipientId
      text
      read
      createdAt
    }
  }
`;
