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
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import validator from "validator";
import axios from "axios";
import { UserStore } from "../../services/stores/user_store";
import { apiUrl } from "../../services/contants";
import { localUrl } from "../../services/contants";
export const FormQcLogin = () => {
//   const setId = UserStore((state) => state.setId);
//   const id = UserStore((state) => state.id);
  const setName = UserStore((state) => state.setName);
  const setContactNo = UserStore((state) => state.setContactNo);
  const setRole = UserStore((state) => state.setRole);
  const setId = UserStore((state) => state.setId);
  const setToken = UserStore((state) => state.setToken);

  const loader = UserStore((state) => state.loader);
  const setLoader = UserStore((state) => state.setLoader);
  const id = UserStore((state) => state.id);
  const toast = useToast();
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
        let userToken = localStorage.getItem("userToken") || "";

        let assignmentSantaBrowserToken = localStorage.getItem(
          "assignmentSantaBrowserToken"
        );
        if (!assignmentSantaBrowserToken) {
          let uniqueBrowserId = `ASSIGNMENT_${new Date().valueOf()}`;
          localStorage.setItem("assignmentSantaBrowserToken", uniqueBrowserId);
          assignmentSantaBrowserToken = uniqueBrowserId;
        }
        localStorage.setItem("userEmail", id);
        let config = {
          headers: { Authorization: `Bearer ${userToken}` },
        };
        const response = await axios.post(
        //   apiUrl + "/user/verify",
        localUrl + "/user/verify",
          {
            _id: id,
            password: password.value,
            assignmentSantaBrowserToken,
          },
          config
        );
        if (response.data.success === true) {
            console.log(response,"successfully logged in the user");
          await setContactNo(
            response.data.contact_no || response.data.user.contact_no
          );
          await setRole(response.data.role || response.data.user.role);
          await setName(response.data.name || response.data.user.name);
          localStorage.setItem("userEmail", id);
          localStorage.setItem(
            "userRole",
            response.data.role || response.data.user.role
          );
          localStorage.setItem(
            "userName",
            response.data.name || response.data.user.name
          );
          localStorage.setItem(
            "userCommission",
            response.data?.userCommission || response.data.user?.userCommission
          );
          //localStorage.setItem('userChatToken', JSON.stringify(response.data.tokenObj));
        //   navigate.replace("/admin/portal");
        // navigate("/admin/portal");
        navigate('/qcorder')
        } else if (response.status == 203) {
          localStorage.setItem("userToken", response.data.token);
          setName(id);
          setToken(assignmentSantaBrowserToken);
          userToken = response.data.token;

          try {
            let config = {
              headers: { Authorization: `Bearer ${userToken}` },
            };
            const response = await axios.post(
            //   apiUrl + "/user/verify",
            localUrl + "/user/verify",
              {
                _id: id,
                password: password.value,
                assignmentSantaBrowserToken,
              },
              config
            );

            if (response.data.success === true) {
                console.log(response,"successfully logged in the user else");
              await setContactNo(response.data.user.contact_no);
              await setRole(response.data.user.role);
              await setName(response.data.user.name);
              localStorage.setItem("userEmail", id);
              localStorage.setItem("userRole", response.data.user.role);
              localStorage.setItem("userName", response.data.user.name);
            //   navigate("/admin/portal")
            navigate('/qcorder')
            //   navigate.replace("/admin/portal");
            }
          } catch (error) {
            toast({
              title: "Admin Approval.",
              description: error.response.data.msg,
              status: "error",
              isClosable: true,
            });
            if (error.response.data.statusCode == 101) {
              setLoader(true);
            }
          }
        }
      } catch (err) {
        toast({
          title: "Error",
          description: err?.response?.data?.msg,
          status: "error",
          isClosable: true,
        });
        if (err?.response?.data?.statusCode == 101) {
          setLoader(true);
        }
      }
    }
  }


//   async function _submit() {
    // let password = document.getElementById("password");

    // let emailVal = false;
    // let passwordVal = false;

    // if (validator.isEmail(id)) {
    //   emailVal = true;
    // } else {
    //   window.alert("Enter Valid Email");
    // }

    // if (
    //   password.value !== null &&
    //   password.value !== undefined &&
    //   password.value == ""
    // ) {
    //   window.alert("Enter Password");
    // } else {
    //   passwordVal = true;
    // }

    // if (emailVal === true && passwordVal === true) {
    //   try {

    //     let qcToken = localStorage.getItem("qcToken");
    //     let config = {
    //       headers: { Authorization: `Bearer ${qcToken}` },
    //     };
    //     const response = await axios.post(
    //     //   apiUrl + "/expert/verifyWithPassword",
    //         // localUrl + "/user/verify",
    //         localUrl + "/loginuser",
    //       {
    //         _id: id,
    //         password: password.value,
    //       },
    //       config
    //     );
    //     console.log(response,"response of qc1 bhar");
    //     if (response.data.success === true) {
    //         console.log(response,"response of qc1");
    //     //   localStorage.setItem("userEmail", id);
    //     //   localStorage.setItem("expertEmail", id);
    //     //   navigate("/expert/portal");
    //     } else if (response.status == 203) {
    //         console.log(response,"response of qc ye 203");
    //       localStorage.setItem("qcToken", response.data.token);
    //       qcToken = response.data.token;

    //       try {
    //         let config = {
    //           headers: { Authorization: `Bearer ${qcToken}` },
    //         };
    //         const response = await axios.post(
    //         //   apiUrl + "/expert/verifyWithPassword",
    //         //  localUrl + "/user/verify",
    //         localUrl + "/loginuser",
             
    //           {
    //             _id: id,
    //             password: password.value,
    //           },
    //           config
    //         );
    //         console.log(response,"response of qc dobara check");
    //         if (response.data.success === true) {
    //             console.log(response,"response of qc");
    //         //   localStorage.setItem("userEmail", id);
    //         //   localStorage.setItem("expertEmail", id);
    //         //   navigate("/expert/portal");
    //         }
    //       } catch (error) {
    //         window.alert("Please enter the correct username and password");
    //         console.log(JSON.stringify(error.response.data));
    //       }
    //     }
    //   } catch (err) {
    //     window.alert("Please enter the correct username and password with last catch");
    //     console.log(JSON.stringify(err));
    //   }
    // }
//   }

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
            QC Portal Login
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





  





















