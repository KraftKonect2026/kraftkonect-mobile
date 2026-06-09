// Turns an Apollo/GraphQL error into a clear, user-facing message.
// GraphQL errors (e.g. "Invalid email or password") are shown verbatim since
// they're written for users. Network/server failures get friendly fallbacks
// instead of cryptic strings like "Failed to fetch" or "502".
export const getApolloErrorMessage = (e: any): string => {
  // 1. Server returned GraphQL-level errors (business logic, validation, auth)
  if (e?.graphQLErrors?.length > 0 && e.graphQLErrors[0]?.message) {
    return e.graphQLErrors[0].message;
  }

  // 2. Server responded but with errors inside the network result body
  if (e?.networkError?.result?.errors?.length > 0) {
    return e.networkError.result.errors[0].message;
  }

  // 3. Server responded with an HTTP error status (502/503/500 etc.)
  const statusCode = e?.networkError?.statusCode ?? e?.statusCode;
  if (typeof statusCode === "number" && statusCode >= 500) {
    return "Our servers are having a moment. Please try again shortly.";
  }
  if (statusCode === 401 || statusCode === 403) {
    return "You're not authorised to do that. Please sign in again.";
  }

  // 4. Request never reached the server (no connection, DNS, timeout)
  const netMsg: string | undefined = e?.networkError?.message ?? e?.message;
  if (
    netMsg &&
    /network request failed|failed to fetch|timeout|timed out|connection|econnrefused|enotfound/i.test(
      netMsg,
    )
  ) {
    return "Can't reach the server. Check your internet connection and try again.";
  }

  // 5. Anything else — surface the message if present, else a safe default
  return netMsg || "Something went wrong. Please try again.";
};
