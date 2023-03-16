import { useParams } from "react-router-dom";
import axios from "axios";
import * as qs from "qs";
import { useEffect, useState, useRef } from "react";
import { apiUrl } from "../services/contants";
import { db } from "../services/firebase";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { AttachmentIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import {
  Button,
  Text,
  HStack,
  Link,
  VStack,
  Box,
  Heading,
  Center,
  InputGroup,
  Input,
  InputRightElement,
  InputLeftElement,
  useDisclosure,
  Spinner,
} from "@chakra-ui/react";
import { useMemo } from "react";

function ExpertOpertorChat() {
  const [assignment, setAssignment] = useState();
  const [loading, setLoading] = useState(true);
  const [expertID, setExpertID] = useState();

  const [token, setToken] = useState("");
  const { onOpen, onClose } = useDisclosure();

  const [inProcessOperatorExpertChat, setInProcessOperatorExpertChat] =
    useState([]);

  const newMessageCounter = useMemo(() => {
    if (assignment && inProcessOperatorExpertChat.length) {
      const lastMessage =
        inProcessOperatorExpertChat[inProcessOperatorExpertChat.length - 1];
      return (lastMessage && lastMessage.newMessageCount) || 0;
    }
    return 0;
  }, [inProcessOperatorExpertChat, assignment]);

  const inputFileOperatorExpert = useRef(null);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    const search = window.location.search;
    if (qs.parse(search)["?jump_to_chat"]) {
      chatBoxRef.current && chatBoxRef.current.scrollIntoView();
    }
  }, [chatBoxRef.current]);

  async function _fetchMessages(id) {
    try {
      const response = await axios.get(apiUrl + "/messages", {
        id: id,
      });
      let resData = response.data.result;
    } catch (err) {
      console.log(err);
    }
  }

  async function _fetchInProcessOperatorExpertChat(
    operatorEmail,
    assignment_id
  ) {
    let expertEmail = localStorage.getItem("expertEmail");
    try {
      const chatName = expertEmail + "_" + operatorEmail + "_" + assignment_id;
      const chatDoc = await getDoc(doc(db, "chat", chatName));
      if (!chatDoc.exists()) {
        await setDoc(doc(db, "chat", chatName), {
          conversation: [],
        });
      }
      const unsubChat = onSnapshot(doc(db, "chat", chatName), (doc) => {
        setInProcessOperatorExpertChat(doc.data().conversation);
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function _fetchToken() {
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

  useEffect(async () => {
    await _fetchToken();
    setExpertID(window.location.pathname.split("/")[2]);
    await _fetchAssignmentDetails();
  }, []);

  let params = useParams();

  async function _fetchAssignmentDetails() {
    try {
      let email = params.expertID;
      if (!email) {
        window.alert("Invalid Link");
      } else {
        let expertToken = localStorage.getItem("expertToken");
        let config = {
          headers: { Authorization: `Bearer ${expertToken}` },
        };
        try {
          const response = await axios.post(
            apiUrl + "/expert/verify",
            {
              _id: email,
            },
            config
          );
          if (response.data.success === true) {
            localStorage.setItem("expertEmail", email);

            let config = {
              headers: { Authorization: `Bearer ${expertToken}` },
            };
            const response = await axios.get(
              apiUrl + "/assignment/fetch?_id=" + params.assignmentID,
              config
            );
            let data = await response.data.assignmentData;
            let expertID = window.location.pathname.split("/")[2];
            if (data.length !== 0) {
              setAssignment({
                id: data[0]._id,
                assignedExpert: data[0].assignedExpert,
                assignedQC: data[0].assignedQC,
                assignedOperator: data[0].assignedOperator,
                client_id: data[0].client_id,
                subject: data[0].subject,
                status: data[0].status,
                quotation: data[0].quotation,
                currencyOfQuote: data[0].currencyOfQuote,
                createdAt:
                  new Date(data[0].createdAt).toLocaleTimeString() +
                  ", " +
                  new Date(data[0].createdAt).toDateString(),
                expertDeadline:
                  new Date(data[0].expertDeadline).toLocaleTimeString() +
                  ", " +
                  new Date(data[0].expertDeadline).toDateString(),
                level: data[0].level,
                reference: data[0].reference,
                description: data[0].description,
                descriptionFile: data[0].descriptionFile,
                numOfPages: data[0].numOfPages,
                paid: data[0].paid,
                deadline:
                  new Date(data[0].deadline).toLocaleTimeString() +
                  ", " +
                  new Date(data[0].deadline).toDateString(),
              });
              await _fetchToken();
              await _fetchInProcessOperatorExpertChat(
                data[0].assignedOperator,
                data[0]._id,
                expertID
              );
              await _fetchMessages(data[0]._id);
            } else {
              console.log("Assignment Not Found");
            }
            setLoading(false);
          } else if (response.status == 203) {
            localStorage.setItem("expertToken", response.data.token);
            expertToken = response.data.token;

            try {
              let config = {
                headers: { Authorization: `Bearer ${expertToken}` },
              };
              const response = await axios.post(
                apiUrl + "/expert/verify",
                {
                  _id: email,
                },
                config
              );
              if (response.data.success === true) {
                localStorage.setItem("expertEmail", email);
                let config = {
                  headers: { Authorization: `Bearer ${expertToken}` },
                };
                const response = await axios.get(
                  apiUrl + "/assignment/fetch?_id=" + params.assignmentID,
                  config
                );
                let data = await response.data.assignmentData;
                if (data.length !== 0) {
                  setAssignment({
                    id: data[0]._id,
                    client_id: data[0].client_id,
                    subject: data[0].subject,
                    status: data[0].status,
                    quotation: data[0].quotation,
                    currencyOfQuote: data[0].currencyOfQuote,
                    createdAt:
                      new Date(data[0].createdAt).toLocaleTimeString() +
                      ", " +
                      new Date(data[0].createdAt).toDateString(),
                    expertDeadline:
                      new Date(data[0].expertDeadline).toLocaleTimeString() +
                      ", " +
                      new Date(data[0].expertDeadline).toDateString(),
                    level: data[0].level,
                    reference: data[0].reference,
                    description: data[0].description,
                    descriptionFile: data[0].descriptionFile,
                    numOfPages: data[0].numOfPages,
                    paid: data[0].paid,
                    deadline:
                      new Date(data[0].deadline).toLocaleTimeString() +
                      ", " +
                      new Date(data[0].deadline).toDateString(),
                  });
                } else {
                  console.log("Assignment Not Found");
                }
                setLoading(false);
              }
            } catch (error) {
              console.log("err");
            }
          }
        } catch (err) {
          window.alert(err.response.data["msg"]);
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
  if (assignment === undefined || assignment.length === 0) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  return (
    <Center>
      <Box
        borderWidth="1px"
        borderRadius="md"
        width={"lg"}
        height={"4xl"}
        marginTop={"20px"}
        ref={chatBoxRef}
      >
        <Box p={4} bgColor="gray.200">
          <HStack>
            <Heading fontSize={"xl"}> Expert Chat with Operator </Heading>{" "}
          </HStack>{" "}
        </Box>{" "}
        <VStack
          alignItems={"start"}
          justifyContent={"space-between"}
          margin={2}
          minH={"90%"}
          maxH={"90%"}
        >
          <VStack overflowY={"scroll"} alignItems={"start"} width={"100%"}>
            {" "}
            {inProcessOperatorExpertChat.map((messageItem, index) => (
              <Box
                display={
                  messageItem.type === "TEXT"
                    ? "flex"
                    : messageItem.type === "MEDIA"
                    ? "flex"
                    : "none"
                }
                alignSelf={
                  messageItem.user === expertID ? "flex-end" : "flex-start"
                }
                flexWrap={true}
                padding={2}
                borderRadius={"md"}
                maxWidth="70%"
                bgColor={
                  messageItem.user === expertID ? "blue.100" : "green.100"
                }
                key={index}
              >
                <VStack maxWidth="100%" overflowWrap={"break-word"}>
                  <Text
                    display={messageItem.type === "TEXT" ? "flex" : "none"}
                    maxWidth={"100%"}
                  >
                    {" "}
                    {messageItem.msg}{" "}
                  </Text>{" "}
                  <Link
                    color={"blue"}
                    fontWeight={"bold"}
                    display={messageItem.type === "MEDIA" ? "flex" : "none"}
                    maxWidth={"100%"}
                    href={messageItem.msg}
                  >
                    {" "}
                    {messageItem.msg && messageItem.msg.substring(62)}{" "}
                  </Link>{" "}
                </VStack>{" "}
              </Box>
            ))}{" "}
          </VStack>{" "}
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
                            assignment.assignedExpert +
                              "_" +
                              assignment.assignedOperator +
                              "_" +
                              assignment.id
                          ),
                          {
                            conversation: arrayUnion({
                              msg: fileUrl,
                              time: Date.now(),
                              type: "MEDIA",
                              user: assignment.assignedExpert,
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
            />{" "}
            <InputLeftElement h={"full"}>
              <Button
                id="attachButton"
                onClick={async () => {
                  inputFileOperatorExpert.current.click();
                }}
              >
                <AttachmentIcon />
              </Button>{" "}
            </InputLeftElement>{" "}
            <InputRightElement h={"full"}>
              <Button
                id="sendButton"
                onClick={async () => {
                  let Regex =
                    /\b[\+]?[(]?[0-9]{2,6}[)]?[-\s\.]?[-\s\/\.0-9]{3,15}\b/m;
                  let textInput = document.getElementById(
                    "addChatOperatorExpert"
                  );
                  if (textInput.value !== "" && textInput.value !== undefined) {
                    if (Regex.test(textInput.value)) {
                      window.alert(
                        "Sharing Phone Numbers through Chat is not allowed"
                      );
                    } else {
                      const chatName =
                        expertID +
                        "_" +
                        assignment.assignedOperator +
                        "_" +
                        assignment.id;

                      const chatDoc = await getDoc(doc(db, "chat", chatName));

                      if (!chatDoc.exists()) {
                        await setDoc(doc(db, "chat", chatName), {
                          conversation: [],
                        });
                      } else {
                        const message = await updateDoc(
                          doc(db, "chat", chatName),
                          {
                            conversation: arrayUnion({
                              msg: textInput.value,
                              time: Date.now(),
                              type: "TEXT",
                              user: expertID,
                              newMessageCount: newMessageCounter + 1,
                            }),
                          }
                        );
                      }
                      const sendMessage = await axios.post(
                        apiUrl + "/messages",
                        {
                          id: assignment.id,
                          expertEmail: expertID,
                        }
                      );
                    }
                  }
                  textInput.value = "";
                }}
              >
                <ArrowForwardIcon />
              </Button>{" "}
            </InputRightElement>{" "}
          </InputGroup>{" "}
        </VStack>{" "}
      </Box>{" "}
    </Center>
  );
}

export default ExpertOpertorChat;
