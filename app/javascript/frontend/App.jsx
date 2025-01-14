import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import { AppContext } from "./components/AppContext";
import { config } from "./Constants";

export default function App() {
  const URL = config.url;
  const [user, setUser] = useState({});
  const [loggedInStatus, setLoggedInStatus] = useState("NOT_LOGGED_IN");
  useEffect(() => {
    if (loggedInStatus === "NOT_LOGGED_IN") {
      fetch(`${URL}/api/logged_in`)
        .then((response) => response.json())
        .then((data) => {
          if (data.logged_in) {
            setUser(data.user);
            setLoggedInStatus("LOGGED_IN");
          }
        });
    }
  }, [loggedInStatus]);

  function handleSuccessfulLogOut() {
    setLoggedInStatus("NOT_LOGGED_IN");

    setUser({});
  }

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
          handleSuccessfulLogOut: handleSuccessfulLogOut,
          user: user,
          url: URL,
        }}
      >
        <Navbar />
        <p>Running in {process.env.NODE_ENV}.</p>
        <Outlet />
      </AppContext.Provider>
    </>
  );
}
