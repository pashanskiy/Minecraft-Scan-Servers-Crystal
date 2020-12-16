import React from 'react';
import ReactDOM from "react-dom";
import App from "./components/app";

//import Button from "./components";


document.addEventListener("DOMContentLoaded", function() {
  ReactDOM.render(
    React.createElement(App),
    //React.createElement(Button),
    document.getElementById("root")
  );
});
