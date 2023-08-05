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
import {
  arrayUnion,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { ArrowForwardIcon, AttachmentIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { db } from "../services/firebase";
import { apiUrl } from "../services/contants";
import { useMemo } from "react";

function ConfirmedOrderMessage({ setMessageCount, setSpinnerLoading }) {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const inputFileOperatorExpert = useRef(null);
  const [token, setToken] = useState("");
  const [openModalId, setOpenModalId] = useState(null);
  const { onOpen, onClose } = useDisclosure();

  const [messageData, setMessageData] = useState([]);
  const [confirmedOperatorExpertChat, setConfirmedOperatorExpertChat] =
    useState({});
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expertChatData, setExpertChatData] = useState([]);
  let confirmOrderAssignedExpertMessages, confirmedMessageData;

  const expertMessageCounter = useMemo(() => {
    if (Object.keys(confirmedOperatorExpertChat).length !== 0) {
      const lastMessage =
        confirmedOperatorExpertChat &&
        openModalId &&
        confirmedOperatorExpertChat[openModalId][
        confirmedOperatorExpertChat[openModalId].length - 1
        ];
      return (lastMessage && lastMessage.expertMsgCount) || 0;
    }
    return 0;
  }, [confirmedOperatorExpertChat]);

  useEffect(() => {
    (async () => {
      await _fetchToken();
    })();
  }, []);

  useEffect(() => {
    setLoading(true);
    _fetchMessages();
    _fetchConfirmedOrders();
  }, []);

  useEffect(() => {
    (async () => {
      if (confirmedMessageData && confirmedMessageData.length !== 0) {
        confirmedMessageData.map(async (msg) => {
          await _fetchConfirmedOperatorExpertChat(msg.expertEmail, msg._id);
        });
      }
    })();
  }, [messageData, confirmedOrders]);

  useEffect(() => {
    if (Object.keys(confirmedOperatorExpertChat).length !== 0) {
      const confirmOrderAssignedExpertChat =
        confirmOrderAssignedExpertMessages &&
        confirmOrderAssignedExpertMessages.filter(
          (data) => data.chat.length !== 0
        );

      let totalMessageCount =
        confirmOrderAssignedExpertChat &&
        confirmOrderAssignedExpertChat
          .filter((data) => data && data.chat)
          .reduce((acc, val) => {
            if (val && val.chat.length !== 0) {
              return acc + val.chat[val.chat.length - 1].operatorMsgCount;
            } else {
              return acc;
            }
          }, 0);
      setMessageCount(totalMessageCount);
      setSpinnerLoading(false);
    } else {
      setSpinnerLoading(false);
    }
  }, [confirmedOperatorExpertChat]);

  async function _fetchToken() {
    let userEmail = localStorage.getItem("expertEmail");
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

  async function _fetchMessages() {
    try {
      const response = await axios.get(apiUrl + "/messages");
      let data = await response.data;
      if (data.success) {
        data.result.length !== 0
          ? setMessageData(data.result)
          : setLoading(false);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function _fetchConfirmedOrders() {
    try {
      let clientToken = localStorage.getItem("expertToken");
      if (clientToken == null) {
        navigate("/expert/login");
      }

      let config = {
        headers: { Authorization: `Bearer ${clientToken}` },
      };
      const response = await axios.post(
        apiUrl + "/assignment/fetch",
        {
          status: {
            $in: [
              "Expert Assigned",
              "Raw Submission",
              "Proof Read",
              "CP2 Done",
            ],
          },
        },
        config
      );
      let data = await response.data.assignmentData;
      if (data && data.length !== 0) {
        setConfirmedOrders(data);
      } else {
        console.log("Assignment Not Found");
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function _fetchConfirmedOperatorExpertChat(expertEmail, assignment_id) {
    try {
      const chatName =
        expertEmail + "_" + "operator_expert_chat" + "_" + assignment_id;

      const chatDoc = await getDoc(doc(db, "chat", chatName));

      if (!chatDoc.exists()) {
        await setDoc(doc(db, "chat", chatName), {
          conversation: [],
        });
      }
      const unsubChat = onSnapshot(doc(db, "chat", chatName), (doc) => {
        setConfirmedOperatorExpertChat((operatorExpertChat) => {
          return {
            ...operatorExpertChat,
            [assignment_id]: doc.data().conversation,
          };
        });

        setLoading(false);
      });
    } catch (error) {
      console.log(error);
    }
  }

  if (confirmedOrders.length !== 0 && messageData.length !== 0) {
    confirmedMessageData = messageData.filter((data) => {
      return confirmedOrders.some((val) => val._id === data._id);
    });
  }
  if (Object.keys(confirmedOperatorExpertChat).length !== 0) {
    confirmOrderAssignedExpertMessages = Object.keys(
      confirmedOperatorExpertChat
    )
      .map((key) => {
        const data = confirmedOperatorExpertChat[key];
        const values =
          data.length !== 0 &&
          data.filter((f) => {
            return f.user !== id;
          });
        const date =
          data.length !== 0 &&
          values.length !== 0 &&
          new Date(values[values.length - 1].time).toLocaleDateString("en-US");

        return {
          id: key,
          chat: values,
          date: date,
        };
      })
      .filter((data) => data && data.chat);
  }

  async function openMessageModal(data) {
    setExpertChatData(data);
    setOpenModalId(data.id);
  }

  function MessageModal({ expertChatData, openModalId }) {
    const MessageModalDis = useDisclosure();

    useEffect(() => {
      if (openModalId) {
        MessageModalDis.onOpen();
      } else {
        MessageModalDis.onClose();
      }
    }, [openModalId]);

    const handleCloseModal = () => {
      setOpenModalId(null);
      MessageModalDis.onClose();
    };

    return (
      <Modal
        size={"lg"}
        onClose={handleCloseModal}
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
                  {confirmedOperatorExpertChat[openModalId] &&
                    confirmedOperatorExpertChat[openModalId].map(
                      (msg, index) => {
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
                      }
                    )}
                </VStack>
                <InputGroup>
                  <Input type="text" id="addChatOperatorExpert" />
                  <Input
                    type="file"
                    id="addFileOperatorExpert"
                    onChange={async () => {
                      let userEmail = localStorage.getItem("expertEmail");

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
                                  userEmail +
                                  "_" +
                                  "operator_expert_chat" +
                                  "_" +
                                  openModalId
                                ),
                                {
                                  conversation: arrayUnion({
                                    msg: fileUrl,
                                    time: Date.now(),
                                    type: "MEDIA",
                                    user: id,
                                    expertMsgCount: expertMessageCounter + 1,
                                    operatorMsgCount: 0,
                                    newMessageCount: 0,
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
                        let userToken = localStorage.getItem("expertToken");
                        let userEmail = localStorage.getItem("expertEmail");
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
                                userEmail +
                                "_" +
                                "operator_expert_chat" +
                                "_" +
                                openModalId
                              ),
                              {
                                conversation: arrayUnion({
                                  msg: textInput.value,
                                  time: Date.now(),
                                  type: "TEXT",
                                  user: id,
                                  expertMsgCount: expertMessageCounter + 1,
                                  operatorMsgCount: 0,
                                  newMessageCount: 0,
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
                                  id: openModalId,
                                  expertEmail:
                                    expertChatData.chat[
                                      expertChatData.chat.length - 1
                                    ].user,
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
      if (confirmedOperatorExpertChat[_assignmentId]) {
        const newChat = confirmedOperatorExpertChat[_assignmentId].slice();
        const lastMsg = newChat.pop();
        const message = await updateDoc(
          doc(
            db,
            "chat",
            id + "_" + "operator_expert_chat" + "_" + _assignmentId
          ),
          {
            conversation: [
              ...newChat,
              {
                ...lastMsg,
                newMessageCount: 0,
                operatorMsgCount: 0,
                expertMsgCount: 0,
              },
            ],
          }
        );
      }
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <>
      {openModalId && (
        <MessageModal
          expertChatData={expertChatData}
          openModalId={openModalId}
        />
      )}
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
              confirmOrderAssignedExpertMessages &&
              confirmOrderAssignedExpertMessages
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
                            data.chat[data.chat.length - 1].operatorMsgCount !==
                            0 && (
                              <div
                                style={{
                                  width: "25px",
                                  height: "25px",
                                  borderRadius: "5px",
                                  background: "#c96969",
                                  cursor: "pointer",
                                  margin: "2px 5px",
                                  color: "#fff",
                                  fontWeight: "bold",
                                  textAlign: "center",
                                }}
                              >
                                {data.chat[data.chat.length - 1]
                                  .operatorMsgCount !== 0 &&
                                  data.chat[data.chat.length - 1]
                                    .operatorMsgCount}
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
                            await readMessages(data.id);
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
