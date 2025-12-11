export const getApolloErrorMessage = (e: any) => {
  if (e?.graphQLErrors?.length > 0) {
    return e.graphQLErrors[0].message;
  }

  if (e?.networkError?.result?.errors?.length > 0) {
    return e.networkError.result.errors[0].message;
  }

  if (e?.networkError?.message) {
    return e.networkError.message;
  }

  return e?.message || "Something went wrong";
};
