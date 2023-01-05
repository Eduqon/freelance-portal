import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Center, ChakraProvider, Heading } from "@chakra-ui/react";
import SubmitQuote from "../src/pages/SubmitQuote";
import ExpertOpertorChat from "./pages/ExpertOperatorChat";

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider>
      <BrowserRouter>
        <Routes>
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
