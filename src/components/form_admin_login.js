import React, { useState } from "react";
import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Stack,
  Button,
  Heading,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import validator from "validator";
import axios from "axios";
import { UserStore } from "../services/stores/user_store";
import { apiUrl } from "../services/contants";

export const FormAdminLogin = () => {
  const setId = UserStore((state) => state.setId);
  const id = UserStore((state) => state.id);

  let navigate = useNavigate();

  async function _submit() {
    let password = document.getElementById("password");

    let emailVal = false;
    let passwordVal = false;

    if (validator.isEmail(id)) {
      emailVal = true;
    } else {
      window.alert("Enter Valid Email");
    }

    if (
      password.value !== null &&
      password.value !== undefined &&
      password.value == ""
    ) {
      window.alert("Enter Password");
    } else {
      passwordVal = true;
    }

    if (emailVal === true && passwordVal === true) {
      try {
        let expertToken = localStorage.getItem("expertToken");
        let config = {
          headers: { Authorization: `Bearer ${expertToken}` },
        };
        const response = await axios.post(
          apiUrl + "/expert/verifyWithPassword",
          {
            _id: id,
            password: password.value,
          },
          config
        );
        if (response.data.success === true) {
          localStorage.setItem("userEmail", id);
          localStorage.setItem("expertEmail", id);
          navigate("/expert/portal");
        } else if (response.status == 203) {
          localStorage.setItem("expertToken", response.data.token);
          expertToken = response.data.token;

          try {
            let config = {
              headers: { Authorization: `Bearer ${expertToken}` },
            };
            const response = await axios.post(
              apiUrl + "/expert/verifyWithPassword",
              {
                _id: id,
                password: password.value,
              },
              config
            );

            if (response.data.success === true) {
              localStorage.setItem("userEmail", id);
              localStorage.setItem("expertEmail", id);
              navigate("/expert/portal");
            }
          } catch (error) {
            window.alert("Please enter the correct username and password");
            console.log(JSON.stringify(error.response.data));
          }
        }
      } catch (err) {
        window.alert("Please enter the correct username and password");
        console.log(JSON.stringify(err));
      }
    }
  }

  return (
    <Flex minH={"80vh"} align={"center"} justify={"center"}>
      <Stack
        spacing={8}
        mx={"auto"}
        maxW={"lg"}
        minW={{ base: "sm", md: "md" }}
        py={12}
        px={6}
      >
        <Stack align={"center"}>
          <Heading fontSize={"3xl"} textAlign={"center"} color={"gray.800"}>
            Admin Portal Login
          </Heading>
        </Stack>
        <Box
          rounded={"lg"}
          bg={useColorModeValue("white", "gray.700")}
          boxShadow={"lg"}
          p={8}
        >
          <Stack spacing={6}>
            <VStack>
              <Box width={"100%"}>
                <FormControl id="email" isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    onChange={async () => {
                      let email = document.getElementById("email");
                      await setId(email.value);
                    }}
                  />
                </FormControl>
              </Box>
              <Box width={"100%"}>
                <FormControl id="password" isRequired>
                  <FormLabel>Password</FormLabel>
                  <Input type="password" />
                </FormControl>
              </Box>
            </VStack>
            <Button
              onClick={() => {
                _submit();
              }}
              size="lg"
              bg={"blue.400"}
              color={"white"}
              _hover={{
                bg: "blue.500",
              }}
            >
              Submit
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Flex>
  );
};
