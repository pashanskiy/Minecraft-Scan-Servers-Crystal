import './styles/styles.css';
import React from 'react';
import ReactDOM from "react-dom";
import App from "./components/app";

document.addEventListener("DOMContentLoaded", function() {
  ReactDOM.render(
    React.createElement(App),
    document.getElementById("root")
  );
});
