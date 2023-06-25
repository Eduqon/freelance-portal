import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Spinner,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { ArrowForwardIcon, AttachmentIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { db } from "../services/firebase";
import { apiUrl } from "../services/contants";

function ConfirmedOrderMessage({
  assignedExpertMessages,
  operatorExpertChat,
  loading,
}) {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const inputFileOperatorExpert = useRef(null);
  const [token, setToken] = useState("");
  const [openModalId, setOpenModalId] = useState(null);
  const { onOpen, onClose } = useDisclosure();

  useEffect(() => {
    (async () => {
      await _fetchToken();
    })();
  }, []);

  async function _fetchToken() {
    let userEmail = localStorage.getItem("userEmail");
    setId(userEmail);
    try {
      const response = await axios.get(
        apiUrl + "/util/sas-token?container_name=assignment-dscp"
      );
      let data = response.data;
      if (data.success) {
        setToken(data.SASToken);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function openMessageModal(data) {
    try {
      let userToken = localStorage.getItem("expertToken");
      if (userToken == null) {
        navigate("/expert/login");
      }
    } catch (err) {
      console.log(err);
    }

    setOpenModalId(data.id);
  }

  function MessageModal({ assignment, assignmentID, openModalId }) {
    const MessageModalDis = useDisclosure();

    useEffect(() => {
      if (assignmentID === openModalId) {
        MessageModalDis.onOpen();
      } else {
        MessageModalDis.onClose();
      }
    }, [assignmentID, openModalId]);

    return (
      <Modal
        size={"lg"}
        onClose={MessageModalDis.onClose}
        isOpen={MessageModalDis.isOpen}
        onOpen={MessageModalDis.onOpen}
        isCentered
      >
        <ModalOverlay />
        <ModalContent maxH={"500px"}>
          <ModalCloseButton />
          <ModalBody>
            <Box
              display="block"
              borderWidth="1px"
              borderRadius="md"
              width={"md"}
            >
              <Box p={4} bgColor="gray.200">
                <HStack>
                  <Heading fontSize={"xl"}>Operator Chat with Expert</Heading>
                </HStack>
              </Box>
              <VStack
                alignItems={"start"}
                justifyContent={"space-between"}
                margin={3}
                minH={"sm"}
                maxH={"sm"}
              >
                <VStack
                  overflowY={"scroll"}
                  alignItems={"start"}
                  width={"100%"}
                >
                  {operatorExpertChat[assignmentID] &&
                    operatorExpertChat[assignmentID].map((msg, index) => {
                      return (
                        <Box
                          display={
                            msg.type === "TEXT"
                              ? "flex"
                              : msg.type === "MEDIA"
                              ? "flex"
                              : "none"
                          }
                          alignSelf={
                            msg.user === id ? "flex-end" : "flex-start"
                          }
                          flexWrap={true}
                          padding={2}
                          borderRadius={"md"}
                          maxWidth="70%"
                          bgColor={msg.user === id ? "blue.100" : "green.100"}
                          key={index}
                        >
                          <VStack maxWidth="100%" overflowWrap={"break-word"}>
                            <Text
                              display={msg.type === "TEXT" ? "flex" : "none"}
                              maxWidth={"100%"}
                            >
                              {msg.msg}
                            </Text>
                            <Link
                              color={"blue"}
                              fontWeight={"bold"}
                              display={msg.type === "MEDIA" ? "flex" : "none"}
                              maxWidth={"100%"}
                              href={msg.msg}
                            >
                              {msg.msg && msg.msg.substring(62)}
                            </Link>
                          </VStack>
                        </Box>
                      );
                    })}
                </VStack>
                <InputGroup>
                  <Input type="text" id="addChatOperatorExpert" />
                  <Input
                    type="file"
                    id="addFileOperatorExpert"
                    onChange={async () => {
                      let fileUrl = "";
                      if (inputFileOperatorExpert) {
                        onOpen();
                        try {
                          var config = {
                            method: "put",
                            url:
                              "https://assignmentsanta.blob.core.windows.net/assignment-dscp/" +
                              encodeURIComponent(
                                inputFileOperatorExpert.current.files[0].name
                              ) +
                              "?" +
                              token,
                            headers: {
                              "x-ms-blob-type": "BlockBlob",
                            },
                            data: inputFileOperatorExpert.current.files[0],
                          };

                          axios(config)
                            .then(async function (response) {
                              fileUrl =
                                "https://assignmentsanta.blob.core.windows.net/assignment-dscp/" +
                                encodeURIComponent(
                                  inputFileOperatorExpert.current.files[0].name
                                );
                              const message = await updateDoc(
                                doc(
                                  db,
                                  "chat",
                                  assignment.chat[assignment.chat.length - 1]
                                    .user +
                                    "_" +
                                    id +
                                    "_" +
                                    assignment.id
                                ),
                                {
                                  conversation: arrayUnion({
                                    msg: fileUrl,
                                    time: Date.now(),
                                    type: "MEDIA",
                                    user: id,
                                  }),
                                }
                              );
                            })
                            .catch(function (error) {
                              console.log(error);
                            });
                        } catch (error) {
                          console.log(error);
                        }
                        onClose();
                      }
                    }}
                    ref={inputFileOperatorExpert}
                    style={{ display: "none" }}
                  />
                  <InputLeftElement h={"full"}>
                    <Button
                      id="attachButton"
                      onClick={async () => {
                        inputFileOperatorExpert.current.click();
                      }}
                    >
                      <AttachmentIcon />
                    </Button>
                  </InputLeftElement>
                  <InputRightElement h={"full"}>
                    <Button
                      id="sendButton"
                      onClick={async () => {
                        let userToken = localStorage.getItem("userToken");
                        let Regex =
                          /\b[\+]?[(]?[0-9]{2,6}[)]?[-\s\.]?[-\s\/\.0-9]{3,15}\b/m;
                        let textInput = document.getElementById(
                          "addChatOperatorExpert"
                        );
                        if (
                          textInput.value !== "" &&
                          textInput.value !== undefined
                        ) {
                          if (Regex.test(textInput.value)) {
                            window.alert(
                              "Sharing Phone Numbers through Chat is not allowed"
                            );
                          } else {
                            const message = await updateDoc(
                              doc(
                                db,
                                "chat",
                                assignment.chat[assignment.chat.length - 1]
                                  .user +
                                  "_" +
                                  id +
                                  "_" +
                                  assignmentID
                              ),
                              {
                                conversation: arrayUnion({
                                  msg: textInput.value,
                                  time: Date.now(),
                                  type: "TEXT",
                                  user: id,
                                }),
                              }
                            );
                            let config = {
                              headers: { Authorization: `Bearer ${userToken}` },
                            };
                            try {
                              const response = await axios.post(
                                apiUrl + "/messages",
                                {
                                  id: assignmentID,
                                  expertEmail: assignment.assignedExpert,
                                },
                                config
                              );
                              let resdata = response.data;
                              if (resdata.success) {
                                textInput.value = "";
                              }
                            } catch (err) {
                              console.log(err);
                            }
                          }
                        }
                      }}
                    >
                      <ArrowForwardIcon />
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </VStack>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  async function readMessages(_assignmentId) {
    try {
      let userToken = localStorage.getItem("expertToken");
      if (userToken == null) {
        navigate("/admin/login");
      }

      let config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      };

      if (operatorExpertChat[_assignmentId]) {
        const newChat = operatorExpertChat[_assignmentId].slice();
        const lastMsg = newChat.pop();
        let userEmail = localStorage.getItem("userEmail");
        const message = await updateDoc(
          doc(db, "chat", lastMsg.user + "_" + userEmail + "_" + _assignmentId),
          {
            conversation: [...newChat, { ...lastMsg, newMessageCount: 0 }],
          }
        );
      }
    } catch (err) {
      console.log(err);
    }
  }
  return (
    <>
      {assignedExpertMessages &&
        assignedExpertMessages
          .filter((data) => data.chat.length !== 0)
          .map((data) => {
            return (
              <MessageModal
                assignment={data}
                assignmentID={data.id}
                openModalId={openModalId}
              />
            );
          })}
      <Box
        display={"block"}
        borderWidth="1px"
        borderRadius="md"
        width={"lg"}
        height={"3xl"}
        marginTop={"20px"}
        overflow={"hidden"}
      >
        <Box p={4} bgColor="gray.200">
          <HStack>
            <Heading fontSize={"xl"}> Confirmed Orders Chats </Heading>{" "}
          </HStack>{" "}
        </Box>{" "}
        <VStack
          alignItems={"start"}
          justifyContent={"space-between"}
          margin={3}
          minH={"2xl"}
          maxH={"2xl"}
          overflowY={"scroll"}
        >
          <VStack alignItems={"start"} width={"100%"}>
            {loading ? (
              <Spinner />
            ) : (
              assignedExpertMessages &&
              assignedExpertMessages
                .filter((data) => data.chat.length !== 0)
                .map((data) => {
                  return (
                    <Box bgColor="blackAlpha.100" width="100%" p={2}>
                      {data.chat.length !== 0 &&
                        data.chat[data.chat.length - 1].user !== "" && (
                          <strong>
                            From: {data.chat[data.chat.length - 1].user}
                          </strong>
                        )}
                      <Box display="flex" justifyContent="space-between">
                        <Box display="flex">
                          <strong>ID:</strong>
                          &nbsp;
                          <a
                            href={"/admin/assignment_details/" + data.id}
                            target="_blank"
                          >
                            {data.id}
                          </a>
                          &nbsp;
                          {data.chat.length !== 0 &&
                            data.chat[data.chat.length - 1].newMessageCount !==
                              0 && (
                              <div
                                className="text-center"
                                style={{
                                  width: "25px",
                                  height: "25px",
                                  borderRadius: "5px",
                                  background: "#c96969",
                                  cursor: "pointer",
                                  margin: "2px 5px",
                                  color: "#fff",
                                  fontWeight: "bold",
                                }}
                              >
                                {data.chat[data.chat.length - 1]
                                  .newMessageCount !== 0 &&
                                  data.chat[data.chat.length - 1]
                                    .newMessageCount}
                              </div>
                            )}
                        </Box>
                        <Box>
                          <span>{data.date}</span>
                        </Box>
                      </Box>
                      <Box
                        display={"flex"}
                        alignItems={"center"}
                        justifyContent={"space-between"}
                      >
                        <strong>
                          Message:{" "}
                          {data.chat.length !== 0 &&
                            data.chat[data.chat.length - 1].msg}
                        </strong>
                        <Button
                          onClick={async () => {
                            await openMessageModal(data);
                            readMessages(data.id.split("_")[0]);
                          }}
                        >
                          Reply
                        </Button>
                      </Box>
                    </Box>
                  );
                })
            )}
          </VStack>
        </VStack>
      </Box>{" "}
    </>
  );
}

export default ConfirmedOrderMessage;
