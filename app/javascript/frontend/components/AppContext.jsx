import { createContext } from "react";

export const AppContext = createContext({
  loggedInStatus: "",
  handleSuccessfulAuth: () => {},
  handleSuccessfulLogOut: () => {},
  user: {},
});
