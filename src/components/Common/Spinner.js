import React from "react";
import "./Common/Spinner.css";

function Spinner({ text = "Loading..." }) {
  return (
    <div className="spinner-container">
      <div className="spinner-ring"></div>
      <p className="spinner-text">{text}</p>
    </div>
  );
}

export default Spinner;
