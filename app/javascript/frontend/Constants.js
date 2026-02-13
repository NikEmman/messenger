// Dynamically determine the API URL based on the current host
// This allows the app to work both in development and production without hardcoding URLs
const getApiUrl = () => {
  const currentHost = window.location.origin;
  return currentHost;
};

export const config = {
  url: getApiUrl(),
};
