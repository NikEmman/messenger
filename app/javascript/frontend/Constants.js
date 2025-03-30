const production = {
  url: "https://messenger-peb1.onrender.com",
};
const development = {
  url: "http://localhost:3000",
};
export const config =
  process.env.NODE_ENV === "production" ? production : development;
