import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Center, ChakraProvider, Heading } from "@chakra-ui/react";
import SubmitQuote from "../src/pages/SubmitQuote";
import ExpertOpertorChat from "./pages/ExpertOperatorChat";
import Portal from "./pages/Portal";
import AdminLogin from "./pages/Login";
import AssignmentDetails from "./pages/AssignmentDetails";
import IsVerify from "./components/IsVerify";
import Qclogin from "./components/Qccomponents/Qclogin";
import QcOrder from "./components/Qccomponents/Qcorder/QcOrder";
import QcPortal from "./components/Qccomponents/QcPortal";

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/expert/login" element={<AdminLogin />} />
          <Route path="/expert/portal" element={<Portal />} />
          <Route path="/verify/:Id" element={<IsVerify />} />
          <Route
            path="/assignment_details/:assignmentID"
            element={<AssignmentDetails />}
          />
          <Route path="/qcorder" element={<QcPortal />} />
          <Route path="/qclogin" element={<Qclogin />} />
          <Route path="/:assignmentID/:expertID" element={<SubmitQuote />} />
          <Route
            path="/:assignmentID/:expertID/expert_Operator_Chat"
            element={<ExpertOpertorChat />}
          />
          <Route
            path="/qc/assignment_details/:assignmentID"
            element={<AssignmentDetails />}
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
