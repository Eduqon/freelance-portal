import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Center, ChakraProvider, Heading } from "@chakra-ui/react";
import SubmitQuote from "../src/pages/SubmitQuote";
import ExpertOpertorChat from "./pages/ExpertOperatorChat";
import Portal from "./pages/Portal";
import AdminLogin from "./pages/Login";
import Isverify from "./pages/IsVerify";
import AssignmentDetails from "./pages/AssignmentDetails";

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/expert/login" element={<AdminLogin />} />
          <Route path="/expert/portal" element={<Portal />} />
          <Route
            path="/assignment_details/:assignmentID"
            element={<AssignmentDetails />}
          />
          <Route path="/verify/:email" element={<Isverify />} />
          <Route path="/:assignmentID/:expertID" element={<SubmitQuote />} />
          <Route
            path="/:assignmentID/:expertID/expert_Operator_Chat"
            element={<ExpertOpertorChat />}
          />
          <Route
            path="*"
            element={
              <Center>
                <Heading>Invalid Route</Heading>
              </Center>
            }
          />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
