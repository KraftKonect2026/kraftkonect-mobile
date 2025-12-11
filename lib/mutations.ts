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