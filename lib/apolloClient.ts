import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  from,
  ApolloLink,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { store } from "@/store";
import { REFRESH_TOKEN_MUTATION } from "./mutations";
import { setTokens, signOut } from "@/store/authSlice";
import { toastRef } from "@/lib/toast";

const httpLink = new HttpLink({
  uri:
    process.env.EXPO_PUBLIC_GRAPHQL_ENDPOINT ||
    "https://artisanhubb-backend.onrender.com/graphql",
});

const authLink = setContext((_, { headers }) => {
  const rawToken = store.getState().auth.accessToken;

  if (!rawToken) {
    return { headers };
  }

  const token = rawToken.trim();
  const authHeaderValue = token.startsWith("Bearer ") ? token : `${token}`;

  return {
    headers: {
      ...headers,
      Authorization: authHeaderValue,
    },
  };
});

let isRefreshing = false;
let pendingRequests: any[] = [];

const resolvePendingRequests = () => {
  pendingRequests.map((callback) => callback());
  pendingRequests = [];
};

const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        if (
          err.message === "Unauthorized" ||
          err.extensions?.code === "UNAUTHENTICATED"
        ) {
          let forward$;

          if (!isRefreshing) {
            isRefreshing = true;
            forward$ = from(
              new Promise<void>(async (resolve, reject) => {
                try {
                  const state = store.getState();
                  const refreshToken = state.auth.refreshToken;

                  if (!refreshToken) {
                    throw new Error("No refresh token available");
                  }

                  // Perform refresh token mutation using fetch to bypass Apollo middleware
                  // Construct the query body manually
                  const response = await fetch(
                    process.env.EXPO_PUBLIC_GRAPHQL_ENDPOINT ||
                      "https://artisanhubb-backend.onrender.com/graphql",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        query: `
                        mutation RefreshToken($refreshToken: String!) {
                          refreshToken(token: $refreshToken) {
                            accessToken
                            refreshToken
                          }
                        }
                      `,
                        variables: {
                          refreshToken,
                        },
                      }),
                    },
                  );

                  const result = await response.json();

                  if (result.errors || !result.data?.refreshToken) {
                    throw new Error("Failed to refresh token");
                  }

                  const { accessToken, refreshToken: newRefreshToken } =
                    result.data.refreshToken;

                  store.dispatch(
                    setTokens({ accessToken, refreshToken: newRefreshToken }),
                  );

                  resolve();
                  resolvePendingRequests();
                } catch (error) {
                  pendingRequests = [];
                  store.dispatch(signOut());
                  toastRef.current?.error(
                    "Session expired",
                    "Please login again",
                  );
                  reject(error);
                } finally {
                  isRefreshing = false;
                }
              }),
            );
          } else {
            forward$ = from(
              new Promise<void>((resolve) => {
                pendingRequests.push(() => resolve());
              }),
            );
          }

          return forward$.flatMap(() => {
            const token = store.getState().auth.accessToken;
            const oldHeaders = operation.getContext().headers;
            operation.setContext({
              headers: {
                ...oldHeaders,
                Authorization: token,
              },
            });
            return forward(operation);
          });
        }
      }
    }

    if (networkError) {
      console.log(`[Network error]: ${networkError}`);
      // Optional: Toast for network errors
    }
  },
);

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
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
