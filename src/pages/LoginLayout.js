import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Flex, useColorModeValue, Button, Image } from "@chakra-ui/react";

function LoginLayout() {
  const navigate = useNavigate();

  function _logout() {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userToken");
    navigate("/expert/login");
  }
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
          {/* {userRole !== null ? <><Examplee /></> : null} */}
          {/* end  */}
          <Flex flex={{ base: 1 }} justify={{ base: "center", md: "start" }}>
            <Image src="/assets/logo.png" w={20} />
          </Flex>
          <Button
            display={
              typeof window !== "undefined" &&
              window.location.pathname === "/expert/login"
                ? "none"
                : "flex"
            }
            onClick={() => {
              _logout();
            }}
          >
            Log Out
          </Button>
        </Flex>
      </Box>
    </>
  );
}

export default LoginLayout;
