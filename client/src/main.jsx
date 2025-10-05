import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import App from "./App.jsx";
import AppContextProvider from "./sharedcontext/SharedContext.jsx";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <AppContextProvider>
      <App />
    </AppContextProvider>

    {/* ✅ ToastContainer is outside App — always mounted */}
    <ToastContainer
      position="top-center"
      autoClose={1500}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      toastClassName="!z-[10000]"
    />
  </BrowserRouter>
);
