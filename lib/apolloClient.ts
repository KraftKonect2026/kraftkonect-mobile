import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import type { GraphQLError } from "graphql";
import { store } from "@/store";
// Adjust path based on your store location

const httpLink = new HttpLink({
  uri:
    process.env.EXPO_PUBLIC_GRAPHQL_ENDPOINT ||
    "https://artisanhubb-backend.onrender.com/graphql",
});

const authLink = setContext((_, { headers }) => {
  const rawToken = store.getState().auth.accessToken;

  if (!rawToken) {
    console.log("Apollo authLink: No token found in store");
    return { headers };
  }

  const token = rawToken.trim();
  const authHeaderValue = token.startsWith("Bearer ")
    ? token
    : `${token}`;

  console.log("Apollo authLink debug:", {
    tokenStart: token.substring(0, 10),
    tokenEnd: token.substring(token.length - 10),
    headerStart: authHeaderValue.substring(0, 20),
    length: token.length,
  });

  return {
    headers: {
      ...headers,
      Authorization: authHeaderValue,
    },
  };
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
  link: from([authLink, httpLink]),
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
