import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  from,
  split,
  Observable,
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { createClient } from "graphql-ws";
import { store } from "@/store";
import { setTokens, signOut } from "@/store/authSlice";
import { toastRef } from "@/lib/toast";

// ── Endpoints ─────────────────────────────────────────────────────────────────

const HTTP_ENDPOINT =
  process.env.EXPO_PUBLIC_GRAPHQL_ENDPOINT ||
  "https://kraftkonnect-backend-230084714703.us-central1.run.app/graphql";

// Derive the WebSocket URL from the HTTP endpoint
const WS_ENDPOINT = HTTP_ENDPOINT.replace(/^https?:\/\//, (prefix) =>
  prefix === "https://" ? "wss://" : "ws://",
);

// ── HTTP link ─────────────────────────────────────────────────────────────────

const httpLink = new HttpLink({ uri: HTTP_ENDPOINT });

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
          let forward$: Observable<void>;

          if (!isRefreshing) {
            isRefreshing = true;
            forward$ = new Observable<void>((observer) => {
              (async () => {
                try {
                  const state = store.getState();
                  const refreshToken = state.auth.refreshToken;

                  if (!refreshToken) {
                    throw new Error("No refresh token available");
                  }

                  const response = await fetch(HTTP_ENDPOINT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      query: `
                        mutation RefreshToken($refreshToken: String!) {
                          refreshToken(token: $refreshToken) {
                            accessToken
                            refreshToken
                          }
                        }
                      `,
                      variables: { refreshToken },
                    }),
                  });

                  const result: any = await response.json();

                  if (result.errors || !result.data?.refreshToken) {
                    throw new Error("Failed to refresh token");
                  }

                  const { accessToken, refreshToken: newRefreshToken } =
                    result.data.refreshToken;

                  store.dispatch(
                    setTokens({ accessToken, refreshToken: newRefreshToken }),
                  );

                  resolvePendingRequests();
                  observer.next();
                  observer.complete();
                } catch (error) {
                  pendingRequests = [];
                  store.dispatch(signOut());
                  toastRef.current?.error("Session expired", "Please login again");
                  observer.error(error);
                } finally {
                  isRefreshing = false;
                }
              })();
            });
          } else {
            forward$ = new Observable<void>((observer) => {
              pendingRequests.push(() => {
                observer.next();
                observer.complete();
              });
            });
          }

          return forward$.flatMap(() => {
            const token = store.getState().auth.accessToken;
            const oldHeaders = operation.getContext().headers;
            operation.setContext({
              headers: { ...oldHeaders, Authorization: token },
            });
            return forward(operation);
          });
        }
      }
    }

    if (networkError) {
      console.log(`[Network error]: ${networkError}`);
    }
  },
);

// ── WebSocket link (subscriptions) ────────────────────────────────────────────

const wsLink = new GraphQLWsLink(
  createClient({
    url: WS_ENDPOINT,
    connectionParams: () => {
      const token = store.getState().auth.accessToken;
      return token ? { Authorization: token } : {};
    },
    shouldRetry: () => true,
    retryAttempts: 5,
  }),
);

// ── Split: subscriptions → WS, everything else → HTTP ────────────────────────

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  from([errorLink, authLink, httpLink]),
);

// ── Apollo Client ─────────────────────────────────────────────────────────────

const client = new ApolloClient({
  link: splitLink,
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
