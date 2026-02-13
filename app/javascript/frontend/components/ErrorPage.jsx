import React from "react";
import { Link } from "react-router-dom";
import "../styles/ErrorPage.css";

const ErrorPage = () => {
  return (
    <div className="errorPage">
      <div className="error-container">
        <h1>Oh no, can&apos;t find this page!</h1>
        <img src="/images/glass.svg" alt="magnifying glass" />
      </div>
      <Link to="/">Back to Home!</Link>
    </div>
  );
};

export default ErrorPage;
