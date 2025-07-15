const production = {
  url: "https://messenger-lr1s.onrender.com/",
};
const development = {
  url: "http://localhost:3000",
};
export const config =
  process.env.NODE_ENV === "production" ? production : development;
