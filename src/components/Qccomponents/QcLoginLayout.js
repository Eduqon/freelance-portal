import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  useColorModeValue,
  Image,
  Button,
  useToast,
} from "@chakra-ui/react";
// import { useRouter } from "next/router";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
// import Examplee from "../../components/sidebar/Sidebar";
import axios from "axios";
import { apiUrl } from "../../services/contants";
import { UserStore } from "../../services/stores/user_store";

function QcLoginLayout() {
  // my adding
  const toast = useToast();
  const [userRole, setUserRole] = useState("");
  const setName = UserStore((state) => state.setName);
  const setContactNo = UserStore((state) => state.setContactNo);
  const setRole = UserStore((state) => state.setRole);
  const setLoader = UserStore((state) => state.setLoader);
  const userEmail = UserStore((state) => state.name);
  const assignmentSantaBrowserToken = UserStore((state) => state.token);
  let navigate = useNavigate();

  async function QC_logout() {
    console.log("yes we are enter dasta in sam,e ");
    const userData = await axios.put(`${apiUrl}/user/updatebyadmin`, {
      _id: userEmail,
      browserId: assignmentSantaBrowserToken,
      isAuthentify: false,
    });

    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");

    // setLoader(false);
    navigate("/qclogin");
    // navigate("/admin/login");
  }

//   const socket = io("https://assignment-santa-api.azurewebsites.net/", {
    const socket = io("http://localhost:8080/", {
    transports: ["websocket", "polling"],
    withCredentials: true,
  });

  useEffect(() => {
    socket.connect();
    socket.on("connect", () => {
      console.log(socket.connected, "socket connected successfully");
    });
  }, []);

  useEffect(() => {
    if (userEmail && assignmentSantaBrowserToken) {
      socket.on("logout", async (user) => {
        if (
          userEmail == user.email &&
          assignmentSantaBrowserToken == user.browserId
        ) {
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userName");
          setLoader(false);
          navigate("/qclogin");
        }
      });
      socket.on("verifyByAdmin", async (user) => {
        let newAssignmentSantaBrowserToken =
          typeof window !== undefined &&
          window.localStorage.getItem("assignmentSantaBrowserToken");
        if (
          userEmail === user.email &&
          newAssignmentSantaBrowserToken === user.browserId
        ) {
          localStorage.setItem("userRole", user.role);
          localStorage.setItem("userName", user.name);
          localStorage.setItem("userCommission", user.userCommission);
          await setContactNo(user.contact_no);
          await setRole(user.role);
          navigate("/admin/portal");
        }
        // socket.on("disconnect");
      });
    }
  }, [userEmail, assignmentSantaBrowserToken, socket]);

  return (
    <>
      <Box>
        <Flex
          bg={useColorModeValue("white", "gray.800")}
          color={useColorModeValue("gray.600", "white")}
          minH={"60px"}
          py={{ base: 2 }}
          px={{ base: 4, md: 10 }}
          borderBottom={1}
          borderStyle={"solid"}
          borderColor={useColorModeValue("gray.200", "gray.900")}
          align={"center"}
        >
          {/* my adding side bar */}
          {/* {userRole !== null ? (
            <>
              <Examplee />
            </>
          ) : null} */}
          {/* end  */}
          <Flex flex={{ base: 1 }} justify={{ base: "center", md: "start" }}>
            <Image src="/assets/Logo.png" w={20} />
          </Flex>
          <Button
            display={
              typeof window !== "undefined" &&
              window.location.pathname === "/admin/login"
                ? "none"
                : "flex"
            }
            onClick={() => {
              QC_logout();
            }}
          >
            Log Out
          </Button>
        </Flex>
      </Box>
    </>
  );
}

export default QcLoginLayout;