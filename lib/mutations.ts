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