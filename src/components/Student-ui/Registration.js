import React from "react";
import { Link } from "react-router-dom";
import "./Registration.css";

function Registration(){
   return(
      <div className="reg-container">
        <div className="reg-box">
            <h2>Student Registration </h2>

            <input className="reg-input" type="email" placeholder="Email"/>
            <input className="reg-input" type="password" placeholder="Password"/>

            <button className="reg-btn">Register</button>

            <p className="reg-hypertext">
                Already Registered? <a href="StudentLogin">Login</a>
            </p>
        </div>
      </div>
   )
}
export default Registration;