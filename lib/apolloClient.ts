import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import type { GraphQLError } from "graphql";

const httpLink = new HttpLink({
  uri:
    process.env.EXPO_PUBLIC_GRAPHQL_ENDPOINT ||
    "https://artisanhubb-backend.onrender.com/graphql",
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors && graphQLErrors.length > 0) {
    // Combine all GraphQL errors into a single message
    const message = graphQLErrors
      .map((err: GraphQLError) => err.message)
      .join("\n");

    throw new Error(message);
  }

  if (networkError) {
    throw networkError;
  }
});

const client = new ApolloClient({
  link: from([httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
});

export default client;
