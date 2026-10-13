import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  from,
  Observable,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { store } from "@/store";
import { setTokens, signOut } from "@/store/authSlice";
import { toastRef } from "@/lib/toast";
import { assertHttpAccountScope, currentRefreshSession, verifiedRefreshTokens } from "@/lib/account/liveAccount";

// ── Endpoints ─────────────────────────────────────────────────────────────────

const HTTP_ENDPOINT =
  process.env.EXPO_PUBLIC_GRAPHQL_ENDPOINT ||
  "https://kraftkonnect-backend-230084714703.us-central1.run.app/graphql";



// ── HTTP link ─────────────────────────────────────────────────────────────────

const httpLink = new HttpLink({ uri: HTTP_ENDPOINT });

const authLink = setContext((_, { headers, accountOwnerId }) => {
  const auth=store.getState().auth;
  const scope=accountOwnerId===undefined?auth.user?.id??null:accountOwnerId;
  assertHttpAccountScope(scope,auth.user?.id??null);
  const rawToken = auth.accessToken;

  if (!rawToken) {
    return { headers,accountOwnerId:scope };
  }

  const token = rawToken.trim();
  const authHeaderValue = token.startsWith("Bearer ") ? token : `${token}`;

  return {
    accountOwnerId:scope,
    headers: {
      ...headers,
      Authorization: authHeaderValue,
    },
  };
});

let isRefreshing = false;
let pendingRequests: {complete:()=>void;reject:(error:unknown)=>void}[] = [];

const resolvePendingRequests = () => {
  pendingRequests.forEach((pending) => pending.complete());
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
          const expectedOwner=operation.getContext().accountOwnerId;
          try{assertHttpAccountScope(expectedOwner??null,store.getState().auth.user?.id??null);}catch(error){return new Observable(observer=>observer.error(error));}
          let forward$: Observable<void>;

          if (!isRefreshing) {
            const origin=store.getState().auth,ownerId=origin.user?.id??null,capturedRefresh=origin.refreshToken;
            isRefreshing = true;
            forward$ = new Observable<void>((observer) => {
              (async () => {
                try {
                  const state = store.getState();
                  const refreshToken = state.auth.refreshToken;
                  if(!capturedRefresh||!currentRefreshSession(ownerId,capturedRefresh,state.auth))throw new Error("The session changed before refresh.");

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

                  if(!currentRefreshSession(ownerId,refreshToken,store.getState().auth))throw new Error("The session changed during refresh.");
                  const { accessToken, refreshToken: newRefreshToken } = verifiedRefreshTokens(result.data.refreshToken);

                  store.dispatch(
                    setTokens({ accessToken, refreshToken: newRefreshToken }),
                  );

                  resolvePendingRequests();
                  observer.next();
                  observer.complete();
                } catch (error) {
                  pendingRequests.forEach(pending=>pending.reject(error));
                  pendingRequests = [];
                  if(capturedRefresh&&currentRefreshSession(ownerId,capturedRefresh,store.getState().auth)){
                    store.dispatch(signOut());
                    toastRef.current?.error("Session expired", "Please login again");
                  }
                  observer.error(error);
                } finally {
                  isRefreshing = false;
                }
              })();
            });
          } else {
            forward$ = new Observable<void>((observer) => {
              pendingRequests.push({complete:() => {
                observer.next();
                observer.complete();
              },reject:error=>observer.error(error)});
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

// ── Apollo Client ─────────────────────────────────────────────────────────────

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

// Shared account data must not survive a switch to a different signed-in identity.
// Switching customer/provider mode keeps the same identity and keeps this cache.
let cacheAccountId = store.getState().auth.user?.id;
store.subscribe(() => {
  const nextAccountId = store.getState().auth.user?.id;
  if (nextAccountId !== cacheAccountId) {
    cacheAccountId = nextAccountId;
    void client.clearStore().catch(() => {});
  }
});
