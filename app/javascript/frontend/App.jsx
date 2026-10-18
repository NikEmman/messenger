import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import { AppContext } from "./components/AppContext";
import { api } from "./api";

export default function App() {
  const [user, setUser] = useState({});
  const [loggedInStatus, setLoggedInStatus] = useState("NOT_LOGGED_IN");
  useEffect(() => {
    if (loggedInStatus === "NOT_LOGGED_IN") {
      api.get("/api/logged_in").then((data) => {
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
        }}
      >
        <Navbar />
        <Outlet />
      </AppContext.Provider>
    </>
  );
}
