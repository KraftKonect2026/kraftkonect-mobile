import { gql } from "@apollo/client";

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