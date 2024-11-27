import { Link } from "react-router-dom";
import React from "react";

const ErrorPage = () => {
  return (
    <div className="errorPage">
      <div className="container">
        <h1>Oh no, can&apos;t find this page!</h1>
        <img src="/images/glass.svg" alt="magnifying glass" />
      </div>
      <Link to="/">
        You can go back to the home page by clicking here, though!
      </Link>
    </div>
  );
};

export default ErrorPage;
