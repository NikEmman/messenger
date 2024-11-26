import React from "react";
import App from "./App";
import ErrorPage from "./components/ErrorPage.jsx";
import Home from "./components/Home.jsx";

const routes = [
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <Home />,
      },
    ],
  },
];

export default routes;
