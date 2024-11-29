import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { AppContext } from "./components/AppContext";

export default function App() {
  const [user, setUser] = useState({});
  const [loggedInStatus, setLoggedInStatus] = useState("NOT_LOGGED_IN");
  const navigate = useNavigate();
  const loginRouter = () => navigate("/login");
  // const homeRouter = navigate("/");

  if (loggedInStatus === "NOT_LOGGED_IN") loginRouter();

  // its a hot mess right now, refactor so home page has login form and if successful
  //re-route to w/e messages and work there

  function handleSuccessfulAuth(user) {
    setLoggedInStatus("LOGGED_IN");
    setUser(user);
  }
  return (
    <>
      <AppContext.Provider
        value={{
          loggedInStatus: loggedInStatus,
          handleSuccessfulAuth: handleSuccessfulAuth,
          user: user,
        }}
      >
        <Navbar />
        <Outlet />
      </AppContext.Provider>
    </>
  );
}
