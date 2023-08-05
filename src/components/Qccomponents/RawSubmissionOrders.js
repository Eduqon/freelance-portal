import { useEffect, useState, useRef } from "react";
// import { useRouter } from "next/router";
import { useNavigate } from "react-router-dom";
import {
  RepeatIcon,
  AttachmentIcon,
  ChatIcon,
  ArrowForwardIcon,
  PhoneIcon,
} from "@chakra-ui/icons";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  HStack,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Link,
  Textarea,
  ModalFooter,
  InputGroup,
  FormLabel,
  FormControl,
  Input,
  InputRightAddon,
  Flex,
  Heading,
  VStack,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  InputLeftElement,
  InputRightElement,
  Spinner,
} from "@chakra-ui/react";
import axios from "axios";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { apiUrl, callingNumbers } from "../../services/contants";
import { db } from "../../services/firebase";

function RawSubmissionOrders({
  incrementCounter,
  decrementCounter,
  confirmOrderAssignedExpertMessages,
  operatorExpertChat,
}) {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState();
  const [loader, setLoader] = useState(true);

  const [messages, setMessages] = useState([]);
  const [id, setId] = useState("");
  const inputFileOperatorExpert = useRef(null);
  const [messageData, setMessageData] = useState([]);
  const [experts, setExperts] = useState([]);
  const [qcs, setQcs] = useState([]);

  const [token, setToken] = useState("");
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isUploading, setIsUploading] = useState(false);
  const [sendRework, setSendRework] = useState(() => new Set());
  const [error, setError] = useState(false);

  const MessagesModalDis = useDisclosure();
  const ReplyMessageModalDis = useDisclosure();

  const CallingModalDis = useDisclosure();

  let expertsList = [];
  let qcList = [];

  let assignmentList = [];
  let submissionsList = [];

  let navigate = useNavigate ();

  useEffect(() => {
    _fetchAssignments();
    _fetchExperts();
    _fetchQcs();
  }, []);

  //---> ask remove expert
  async function removeExpert(index) {
    try {
      let userToken = localStorage.getItem("userToken");
      let config = {
        headers: { Authorization: `Bearer ${userToken}` },
      };
      const response = await axios.post(
        apiUrl + "/expert/remove/ask",
        {
          assignmentId: assignments[index].id,
        },
        config
      );
      window.alert("Operator asked for approval to remove expert");
    } catch (error) {
      //console.log(error);
    }
  }

  async function markAsProofRead(index) {
    try {
      let userToken = localStorage.getItem("userToken");
      let userEmail = localStorage.getItem("userEmail");
      let config = {
        headers: { Authorization: `Bearer ${userToken}` },
      };
      const response = await axios.post(
        apiUrl + "/assignment/update",
        {
          _id: assignments[index].id,
          status: "Proof Read",
          sendReworkFrom: "",
          assignedQC: userEmail,
          currentState: 7,
          order_placed_time: {
            ...assignments[index].order_placed_time,
            7: Date.now(),
          },
        },
        config
      );

      const createNotification = await axios.post(
        apiUrl + "/notifications",
        {
          assignmentId: assignments[index].id,
          status: "Proof Read",
          read: false,
        },
        config
      );
      incrementCounter("Proof Read");
      decrementCounter("Raw Submission");
      _fetchAssignments();
    } catch (error) {
      console.log(error);
    }
  }

  async function sendForRework(index, qcComments, inputValue) {
    let userEmail = localStorage.getItem("userEmail");
    let userName = localStorage.getItem("userName");
    let iso;
    if (!inputValue.date || !inputValue.time) {
      setError(true);
    } else {
      let splitDate = inputValue.date.split("-");

      let year = splitDate[0];
      let month = splitDate[1];
      let day = splitDate[2];

      let splitTime = inputValue.time.split(":");

      let hour = splitTime[0];
      let min = splitTime[1];
      let deadline = new Date(year, month - 1, day, hour, min, 0);

      iso = deadline?.toISOString();
    }

    if (qcComments === "") {
      window.alert("Add a comment");
    } else {
      if (fileUrl === "") {
        try {
          let userToken = localStorage.getItem("userToken");
          let config = {
            headers: { Authorization: `Bearer ${userToken}` },
          };
          const response = await axios.post(
            apiUrl + "/assignment/update",
            {
              _id: assignments[index].id,
              status: "Internal Rework",
              assignedQC: userEmail,
              currentState: 6,
              order_placed_time: {
                ...assignments[index].order_placed_time,
                6: Date.now(),
              },
              expertDeadline: assignments[index].expertDeadline[
                assignments[index].id
              ]
                ? {
                    [[assignments[index].id]]: [
                      ...assignments[index].expertDeadline[
                        assignments[index].id
                      ],
                      iso,
                    ],
                  }
                : {
                    [assignments[index].id]: [iso],
                  },
              internal_rework_date: assignments[index].internal_rework_date[
                assignments[index].id
              ]
                ? {
                    [[assignments[index].id]]: [
                      ...assignments[index].internal_rework_date[
                        [assignments[index].id]
                      ],
                      Date.now(),
                    ],
                  }
                : {
                    [assignments[index].id]: [Date.now()],
                  },
              internal_rework: assignments[index].internal_rework[
                assignments[index].id
              ]
                ? {
                    [[assignments[index].id]]: [
                      ...assignments[index].internal_rework[
                        [assignments[index].id]
                      ],
                      {
                        file: "",
                        comment: qcComments,
                      },
                    ],
                  }
                : {
                    [assignments[index].id]: [
                      {
                        file: "",
                        comment: qcComments,
                      },
                    ],
                  },
            },
            config
          );
          const createNotification = await axios.post(
            apiUrl + "/notifications",
            {
              assignmentId: assignments[index].id,
              read: false,
            },
            config
          );
          incrementCounter("Internal Rework");
          decrementCounter("Raw Submission");
          const responseQcNote = await axios.post(
            apiUrl + "/assignment/comments/QCToExpert",
            {
              assignmentId: assignments[index].id,
              expertId: assignments[index].assignedExpert,
              commentsFromQC: {
                _id: userEmail,
                name: userName,
                comment: qcComments,
                deadline: iso,
              },
            },
            config
          );
          _fetchAssignments();
          ReworkModalDis.onClose();
        } catch (error) {
          console.log(error);
        }
      } else {
        try {
          let userToken = localStorage.getItem("userToken");
          let config = {
            headers: { Authorization: `Bearer ${userToken}` },
          };

          setSendRework((prev) => new Set(prev).add(assignments[index].id));
          const response = await axios.post(
            apiUrl + "/assignment/update",
            {
              _id: assignments[index].id,
              status: "Internal Rework",
              assignedQC: userEmail,
              sendReworkFrom: "Raw Submission",
              expertDeadline: assignments[index].expertDeadline[
                assignments[index].id
              ]
                ? {
                    [[assignments[index].id]]: [
                      ...assignments[index].expertDeadline[
                        assignments[index].id
                      ],
                      iso,
                    ],
                  }
                : {
                    [assignments[index].id]: [iso],
                  },

              internal_rework_date: assignments[index].internal_rework_date[
                assignments[index].id
              ]
                ? {
                    [[assignments[index].id]]: [
                      ...assignments[index].internal_rework_date[
                        [assignments[index].id]
                      ],
                      Date.now(),
                    ],
                  }
                : {
                    [assignments[index].id]: [Date.now()],
                  },
              internal_rework: assignments[index].internal_rework[
                assignments[index].id
              ]
                ? {
                    [[assignments[index].id]]: [
                      ...assignments[index].internal_rework[
                        [assignments[index].id]
                      ],
                      {
                        file: fileUrl,
                        comment: qcComments,
                      },
                    ],
                  }
                : {
                    [assignments[index].id]: [
                      {
                        file: fileUrl,
                        comment: qcComments,
                      },
                    ],
                  },
              currentState: 6,
              order_placed_time: {
                ...assignments[index].order_placed_time,
                6: Date.now(),
              },
            },
            config
          );
          const createNotification = await axios.post(
            apiUrl + "/notifications",
            {
              assignmentId: assignments[index].id,
              read: false,
            },
            config
          );
          incrementCounter("Internal Rework");
          decrementCounter("Raw Submission");
          const responseQcMail = await axios.post(
            apiUrl + "/assignment/comments/QCToExpert",
            {
              assignmentId: assignments[index].id,
              expertId: assignments[index].assignedExpert,
              commentsFromQC: {
                _id: userEmail,
                name: userName,
                file: fileUrl,
                comment: qcComments,
                deadline: iso,
              },
            },
            config
          );
          _fetchAssignments();
          ReworkModalDis.onClose();
        } catch (error) {
          console.log(error);
        }
      }
    }
  }

  const ReworkModalDis = useDisclosure();

  async function openReworkModal(index) {
    setSelectedIndex(index);
    setFileName("");
    setFileUrl("");
    ReworkModalDis.onOpen();
  }

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

  async function uploadFile(blobName, filePath) {
    setIsUploading(true);
    var data = filePath;

    var config = {
      method: "put",
      url:
        "https://assignmentsanta.blob.core.windows.net/assignment-dscp/" +
        encodeURIComponent(blobName) +
        "?" +
        token,
      headers: {
        "x-ms-blob-type": "BlockBlob",
      },
      data: data,
    };

    axios(config)
      .then(function (response) {
        setFileUrl(
          "https://assignmentsanta.blob.core.windows.net/assignment-dscp/" +
            encodeURIComponent(blobName)
        );
        setIsUploading(false);
      })
      .catch(function (error) {
        console.log(error);
        setIsUploading(false);
      });
  }

  function ReworkModal() {
    const [qcComments, setQcComment] = useState("");
    const [inputValue, setInputValue] = useState({
      date: "",
      time: "",
    });
    const closeModal = () => {
      setInputValue({
        date: "",
        time: "",
      });
      ReworkModalDis.onClose();
    };

    return (
      <Modal
        size={"2xl"}
        onClose={ReworkModalDis.onClose}
        isOpen={ReworkModalDis.isOpen}
        onOpen={ReworkModalDis.onOpen}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Rework Request</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl id="file">
              <FormLabel>1) Upload File</FormLabel>
              <InputGroup>
                <Input type="text" isReadOnly={true} value={fileName} />
                <InputRightAddon>
                  <Button onClick={() => inputRef.current.click()}>
                    <AttachmentIcon />
                  </Button>
                  <input
                    type="file"
                    onChange={async () => {
                      setFileName(inputRef.current.files[0].name);
                      await uploadFile(
                        inputRef.current.files[0].name,
                        inputRef.current.files[0]
                      );
                    }}
                    ref={inputRef}
                    style={{ display: "none" }}
                  />
                </InputRightAddon>
              </InputGroup>
            </FormControl>
            <InputGroup flexDirection={"column"}>
              <FormLabel>2) Add Comments For Experts</FormLabel>
              <Textarea
                //id="qcComment"
                value={qcComments}
                onChange={(e) => {
                  setQcComment(e.target.value);
                }}
              ></Textarea>
            </InputGroup>
            <FormControl padding={2} id="expertDeadline">
              <FormLabel fontWeight={"bold"}>3) Set Expert Deadline</FormLabel>
              <HStack>
                <Input
                  type="date"
                  id="date"
                  value={inputValue.date}
                  onChange={(e) => {
                    setInputValue({
                      ...inputValue,
                      date: e.target.value,
                    });
                  }}
                />
                <Input
                  type="time"
                  id="time"
                  value={inputValue.time}
                  onChange={(e) => {
                    setInputValue({
                      ...inputValue,
                      time: e.target.value,
                    });
                  }}
                />
              </HStack>
              {error && (
                <span style={{ color: "red" }}>
                  ** Expert Deadline is mandatory
                </span>
              )}
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={() => {
                if (isUploading) {
                  window.alert("File is still being uploaded");
                } else {
                  sendForRework(selectedIndex, qcComments, inputValue);
                }
              }}
            >
              Send
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  const SubmissionsModalDis = useDisclosure();

  async function openSubmissionsModal(index) {
    setSelectedIndex(index);
    try {
      let userToken = localStorage.getItem("userToken");
      if (userToken == null) {
        navigate("/admin/login");
      }

      let config = {
        headers: { Authorization: `Bearer ${userToken}` },
      };
      const response = await axios.get(
        apiUrl +
          "/assignment/submissions/fetch?assignment_id=" +
          assignments[index].id,
        config
      );
      let data = await response.data.result.workSubmissions;
      submissionsList = [];
      if (data.length !== 0) {
        for (let index = 0; index < data.length; index++) {
          submissionsList.push({
            _id: data[index]._id,
            name: data[index].name,
            url: data[index].url,
            category: data[index].category,
            createdAt:
              new Date(data[index].createdAt).toLocaleTimeString() +
              ", " +
              new Date(data[index].createdAt).toDateString(),
            createdAtNF: data[index].createdAt,
            expertId: data[index].expertId,
          });
        }
      } else {
        window.alert("No Submissions Found");
      }
      setSubmissions(submissionsList);
    } catch (err) {
      console.log(err);
    }
    SubmissionsModalDis.onOpen();
  }

  function SubmissionsModal() {
    return (
      <Modal
        size={"4xl"}
        onClose={SubmissionsModalDis.onClose}
        isOpen={SubmissionsModalDis.isOpen}
        onOpen={SubmissionsModalDis.onOpen}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Submissions</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Table variant="simple" size="sm">
              <Thead bgColor={"gray.200"}>
                <Tr>
                  <Th>File</Th>
                  <Th>Category</Th>
                  <Th>Date</Th>
                  <Th>Delivery</Th>
                  <Th>Expert ID</Th>
                </Tr>
              </Thead>
              <Tbody>
                {submissions.length === 0 ? (
                  <></>
                ) : (
                  submissions.map((submission, index) => (
                    <Tr key={submission._id}>
                      <Td maxW={"100px"}>
                        <Link isExternal={true} href={submission.url}>
                          {submission.name}
                        </Link>
                      </Td>
                      <Td>{submission.category}</Td>
                      <Td>{submission.createdAt}</Td>
                      <Td
                        color={
                          new Date(submission.createdAtNF) -
                            new Date(
                              assignments[selectedIndex]?.expertDeadlineNF
                            ) <=
                          0
                            ? "green"
                            : "red"
                        }
                      >
                        {new Date(submission.createdAtNF) -
                          new Date(
                            assignments[selectedIndex]?.expertDeadlineNF
                          ) <=
                        0
                          ? "On Time"
                          : "Late"}
                      </Td>
                      <Td>{submission.expertId}</Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  async function _fetchAssignments() {
    try {
      let userToken = localStorage.getItem("userToken");
      if (userToken == null) {
        navigate("/admin/login");
      }

      let config = {
        headers: { Authorization: `Bearer ${userToken}` },
      };
      const response = await axios.get(
        apiUrl + `/assignment/fetch?status=Raw%20Submission`,
        config
      );
      let data = response.data.assignmentData;
      assignmentList = [];
      if (data.length !== 0) {
        for (let index = 0; index < data.length; index++) {
          assignmentList.push({
            id: data[index]._id,
            assignedExpert: data[index].assignedExpert,
            assignedQC: data[index].assignedQC,
            client_id: data[index].client_id,
            subject: data[index].subject,
            status: data[index].status,
            quotation: data[index].quotation,
            currencyOfQuote: data[index].currencyOfQuote,
            level: data[index].level,
            reference: data[index].reference,
            description: data[index].description,
            descriptionFile: data[index].descriptionFile,
            order_placed_time: data[index].order_placed_time,
            numOfPages: data[index].numOfPages,
            paid: data[index].paid,
            countryCode: data[index].countrycode,
            contact_no: data[index].contact_no,
            deadline:
              new Date(data[index].deadline).toLocaleTimeString() +
              ", " +
              new Date(data[index].deadline).toDateString(),
            expertDeadline: data[index].expertDeadline
              ? data[index].expertDeadline
              : [],
            expertDeadlineNF: data[index].expertDeadline
              ? data[index].expertDeadline[data[index]._id]
              : "",
            retryCount: data[index].retryCount,
            internal_rework_date: data[index].internal_rework_date
              ? data[index].internal_rework_date
              : [],
            internal_rework: data[index].internal_rework
              ? data[index].internal_rework
              : [],
          });
        }
        await _fetchToken();
      } else {
        console.log("No Raw Submission Orders");
      }
      setLoader(false);
      setAssignments(assignmentList);
    } catch (err) {
      console.log(err);
    }
  }

  async function openReplyMessageModal(data) {
    try {
      let userToken = localStorage.getItem("userToken");
      if (userToken == null) {
        navigate("/admin/login");
      }
    } catch (err) {
      console.log(err);
    }
    setMessages(data);
    ReplyMessageModalDis.onOpen();
  }

  function ReplyMessageModal() {
    return (
      <Modal
        size={"lg"}
        onClose={ReplyMessageModalDis.onClose}
        isOpen={ReplyMessageModalDis.isOpen}
        onOpen={ReplyMessageModalDis.onOpen}
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
                  {messages &&
                    operatorExpertChat &&
                    operatorExpertChat[messages.id] &&
                    operatorExpertChat[messages.id].map((msg, index) => {
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
                                  messages.chat[messages.chat.length - 1].user +
                                    "_" +
                                    id +
                                    "_" +
                                    messages.id
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
                                messages.chat[messages.chat.length - 1].user +
                                  "_" +
                                  id +
                                  "_" +
                                  messages.id
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
                                  id: messages.id,
                                  expertEmail:
                                    messages.chat[messages.chat.length - 1]
                                      .user,
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
      let userToken = localStorage.getItem("userToken");
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

  async function openMessageModal(index) {
    setSelectedIndex(index);
    const message = await confirmOrderAssignedExpertMessages.filter((data) => {
      return assignments[index].id === data.id;
    });
    setMessageData(message);
    MessagesModalDis.onOpen();
  }

  function MessageModal() {
    return (
      <Modal
        size={"4xl"}
        onClose={MessagesModalDis.onClose}
        isOpen={MessagesModalDis.isOpen}
        onOpen={MessagesModalDis.onOpen}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Messages</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Table variant="simple" size="sm">
              <Thead bgColor={"gray.200"}>
                <Tr>
                  <Th>Id</Th>
                  <Th>Expert Email</Th>
                  <Th>Messages</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {messageData && messageData.length === 0 ? (
                  <></>
                ) : (
                  messageData &&
                  messageData.map((msg, index) => (
                    <Tr key={msg.id}>
                      <Td>{msg.id}</Td>
                      <Td>{msg.chat[msg.chat.length - 1].user}</Td>
                      <Td>{msg.chat[msg.chat.length - 1].msg}</Td>
                      <Td>
                        <HStack>
                          <Button
                            onClick={async () => {
                              await openReplyMessageModal(msg);
                              readMessages(msg.id);
                            }}
                          >
                            Reply
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  async function _fetchQcs() {
    try {
      let userToken = localStorage.getItem("userToken");
      if (userToken == null) {
        navigate("/admin/login");
      }

      let config = {
        headers: { Authorization: `Bearer ${userToken}` },
      };
      const response = await axios.post(
        apiUrl + "/user/fetch",
        {
          role: "QC",
        },
        config
      );
      let data = response.data.res;
      qcList = [];
      if (data.length !== 0) {
        for (let index = 0; index < data.length; index++) {
          qcList.push({
            id: data[index]._id,
            name: data[index].name,
            contact_no: data[index].contact_no,
          });
        }
      } else {
        console.log("No QC");
      }
      setQcs(qcList);
    } catch (err) {
      console.log(err);
    }
  }

  async function _fetchExperts() {
    try {
      let userToken = localStorage.getItem("userToken");
      if (userToken == null) {
        navigate("/admin/login");
      }

      let config = {
        headers: { Authorization: `Bearer ${userToken}` },
      };
      const response = await axios.post(apiUrl + "/expert/fetch", config);
      let data = response.data.res;
      expertsList = [];
      if (data.length !== 0) {
        for (let index = 0; index < data.length; index++) {
          expertsList.push({
            id: data[index]._id,
            name: data[index].name,
            contact_no: data[index].contact_no,
            subject: data[index].subject,
          });
        }
      } else {
        console.log("No Experts");
      }
      setExperts(expertsList);
    } catch (err) {
      console.log(err);
    }
  }
  async function openCallingModal(index) {
    setSelectedIndex(index);
    CallingModalDis.onOpen();
  }

  function CallingModal() {
    return (
      <Modal
        size={"md"}
        onClose={CallingModalDis.onClose}
        isOpen={CallingModalDis.isOpen}
        onOpen={CallingModalDis.onOpen}
        isCentered
      >
        <ModalOverlay />
        <ModalContent maxH={"500px"} overflowY="scroll">
          <ModalHeader>Choose Caller ID</ModalHeader>
          <hr />
          <ModalCloseButton />
          <ModalBody>
            <Table marginTop={2} variant="simple" size="sm">
              <Tbody>
                <Heading size={"sm"}>
                  Which number do you want the recipient to see ?
                </Heading>
                <br />
                {callingNumbers.map((number, index) => {
                  return (
                    <>
                      <Button
                        width={"100%"}
                        marginBottom={2}
                        onClick={() => {
                          _calling(
                            assignments[selectedIndex].countryCode,
                            assignments[selectedIndex].contact_no,
                            index
                          );
                        }}
                      >
                        {number}
                      </Button>
                    </>
                  );
                })}
              </Tbody>
            </Table>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  async function _calling(countrycode, client_number, callingIndex) {
    try {
      if (countrycode !== 91) {
        const response = await axios.post(apiUrl + "/calling/international", {
          clientNumber: Number(String(countrycode) + String(client_number)),
          CallerId: +callingNumbers[callingIndex],
        });
        if (response.status === 200) {
          window.alert("Call has been initiated");
        } else {
          window.alert("Call has not been initiated due to some reason.");
        }
      } else {
        const response = await axios.post(apiUrl + "/calling", {
          clientNumber: String(client_number),
        });
        if (response.data.msg === "Call originate succesfully.") {
          window.alert("Call has been initiated");
        } else {
          window.alert(
            `Call has not been initiated due to ${response.data.msg}.`
          );
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function _expertCalling(assignedExpert) {
    const expert_number = experts.find(
      (expert) => expert.id === assignedExpert
    )?.contact_no;
    try {
      const response = await axios.post(apiUrl + "/calling", {
        clientNumber: String(expert_number),
      });
      if (response.data.msg === "Call originate succesfully.") {
        window.alert("Call has been initiated");
      } else {
        window.alert(
          `Call has not been initiated due to ${response.data.msg}.`
        );
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function _qcCalling(assignedQc) {
    const qc_number = qcs.find((qc) => qc.id === assignedQc)?.contact_no;
    try {
      if (!qc_number) {
        window.alert("Please use the correct Number !");
      } else {
        const response = await axios.post(apiUrl + "/calling", {
          clientNumber: String(qc_number),
        });
        if (response.data.msg === "Call originate succesfully.") {
          window.alert("Call has been initiated");
        } else {
          window.alert(
            `Call has not been initiated due to ${response.data.msg}.`
          );
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <>
      <div display={{ base: "none", sm: "block", md: "block" }}>
        <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>File Upload</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>File is being uploaded, please wait..</ModalBody>
          </ModalContent>
        </Modal>
        <MessageModal />
        <ReplyMessageModal />
        <SubmissionsModal />
        <CallingModal />
        <ReworkModal />
        <Table
          variant="simple"
          size="md"
          display={{ base: "none", sm: "block", md: "block" }}
        >
          <Thead bgColor={"gray.200"}>
            <Tr>
              <Th>Id</Th>
              <Th>Subject</Th>
              <Th>Student No.</Th>
              <Th>Deadline</Th>
              <Th>Expert Deadline</Th>
              <Th>Assigned Expert</Th>
              <Th>Assigned QC</Th>
              <Th>
                <Button
                  leftIcon={<RepeatIcon />}
                  onClick={async () => {
                    await _fetchAssignments();
                  }}
                >
                  Refresh
                </Button>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {assignments.length === 0 ? (
              <>No Orders</>
            ) : (
              assignments.map((assignment, index) => (
                <Tr key={assignment.id}>
                  <Td fontWeight={"semibold"} padding={0}>
                    <Box display={"flex"} alignItems="center">
                      <Link href={"/admin/assignment_details/" + assignment.id}>
                        {assignment.id}&nbsp;
                      </Link>
                      <Button
                        background={"none"}
                        _focus={{ outline: "none" }}
                        _hover={{ background: "none" }}
                        color={"#dc3545"}
                        onClick={() => openCallingModal(index)}
                      >
                        <PhoneIcon />
                      </Button>

                      {confirmOrderAssignedExpertMessages &&
                        confirmOrderAssignedExpertMessages.length !== 0 &&
                        confirmOrderAssignedExpertMessages.map((data) => {
                          if (data.id === assignment.id) {
                            if (
                              data.chat &&
                              data.chat[data.chat.length - 1]
                                .newMessageCount !== 0
                            ) {
                              return (
                                <Box
                                  display="flex"
                                  alignItems={"center"}
                                  position="relative"
                                  marginLeft={2}
                                  cursor={"pointer"}
                                  onClick={async () => openMessageModal(index)}
                                >
                                  <ChatIcon width={"1.5em"} height={"1.5em"} />
                                  <Box
                                    display={"flex"}
                                    alignItems={"center"}
                                    justifyContent={"center"}
                                    borderRadius={15}
                                    backgroundColor={"rgb(201, 105, 105)"}
                                    marginLeft={2}
                                    width={5}
                                    height={5}
                                    color={"white"}
                                    position={"absolute"}
                                    right={"-10px"}
                                    top={"-5px"}
                                  >
                                    {data.chat &&
                                      data.chat[data.chat.length - 1]
                                        .newMessageCount}
                                  </Box>
                                </Box>
                              );
                            }
                          }
                        })}
                      {assignment.retryCount > 1 && (
                        <div
                          className="d-flex align-items-center justify-content-center border-set"
                          style={{
                            width: "20px",
                            height: "20px",
                            border: "1px solid",
                            borderRadius: "50px",
                            fontSize: "12px",
                          }}
                        >
                          R{assignment.retryCount - 1}
                        </div>
                      )}
                    </Box>
                  </Td>
                  <Td color={"green.600"} fontWeight={"semibold"}>
                    {assignment.subject}
                  </Td>
                  <Td textAlign={"center"}>
                    {localStorage.getItem("userRole") === "Super Admin" ||
                    localStorage.getItem("userRole") === "Admin"
                      ? "+" +
                        String(assignment.countryCode) +
                        " " +
                        assignment.contact_no
                      : "+" +
                        String(assignment.countryCode) +
                        " " +
                        String(assignment.contact_no).substring(0, 2) +
                        "********" +
                        String(assignment.contact_no).substring(8, 10)}
                  </Td>
                  <Td color={"red.600"} fontWeight={"semibold"}>
                    {assignment.deadline}
                  </Td>
                  <Td color={"red.600"} fontWeight={"semibold"}>
                    {assignment.expertDeadline
                      ? new Date(
                          assignment.expertDeadline[assignment.id][
                            assignment.expertDeadline[assignment.id].length - 1
                          ]
                        ).toLocaleTimeString() +
                        ", " +
                        new Date(
                          assignment.expertDeadline[assignment.id][
                            assignment.expertDeadline[assignment.id].length - 1
                          ]
                        ).toDateString()
                      : ""}
                  </Td>
                  <Td>
                    <Box display="flex" alignItems="center">
                      {localStorage.getItem("userRole") === "Super Admin" ||
                      localStorage.getItem("userRole") === "Admin"
                        ? assignment.assignedExpert
                        : assignment.assignedExpert.substring(0, 2) +
                          "****" +
                          "@" +
                          "****" +
                          ".com"}
                      <Button
                        background={"none"}
                        _focus={{ outline: "none" }}
                        _hover={{ background: "none" }}
                        color={"#dc3545"}
                        onClick={() =>
                          _expertCalling(assignment.assignedExpert)
                        }
                      >
                        <PhoneIcon />
                      </Button>
                    </Box>
                  </Td>
                  {assignment.assignedQC ? (
                    <Td>
                      <Box display="flex" alignItems="center">
                        {localStorage.getItem("userRole") === "Super Admin" ||
                        localStorage.getItem("userRole") === "Admin"
                          ? assignment.assignedQC
                          : assignment.assignedQC?.substring(0, 2) +
                            "****" +
                            "@" +
                            "****" +
                            ".com"}
                        <Button
                          background={"none"}
                          _focus={{ outline: "none" }}
                          _hover={{ background: "none" }}
                          color={"#dc3545"}
                          onClick={() => _qcCalling(assignment.assignedQC)}
                        >
                          <PhoneIcon />
                        </Button>
                      </Box>
                    </Td>
                  ) : (
                    <Td></Td>
                  )}
                  <Td>
                    <HStack>
                      <Button onClick={async () => openSubmissionsModal(index)}>
                        Submissions from Experts
                      </Button>
                      <Button onClick={async () => markAsProofRead(index)}>
                        Mark as Proof Read
                      </Button>
                      <Flex>
                        <HStack flexDirection="column" gap={2}>
                          <Button
                            color={"red"}
                            onClick={async () => openReworkModal(index)}
                            disabled={sendRework.has(assignment.id)}
                          >
                            {sendRework.has(assignment.id)
                              ? "Asked for Rework"
                              : "Send for Rework"}
                          </Button>
                        </HStack>
                      </Flex>
                      <Button
                        color={"red"}
                        onClick={async () => removeExpert(index)}
                      >
                        Remove Expert
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </div>
      {/* ACCORDION MOBILE */}
      <div className="ShowSideClick">
        {assignments.map((assignment, index) => (
          <Accordion
            defaultIndex={[0]}
            allowMultiple
            display={{ base: "block", sm: "none", md: "none" }}
          >
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Table>
                      <Tr>
                        <Th>Id</Th>
                        <Td fontWeight={"semibold"}>
                          <Link
                            href={"/admin/assignment_details/" + assignment.id}
                          >
                            {assignment.id}
                          </Link>
                        </Td>
                      </Tr>
                    </Table>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <Modal
                  closeOnOverlayClick={false}
                  isOpen={isOpen}
                  onClose={onClose}
                >
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader>File Upload</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                      File is being uploaded, please wait..
                    </ModalBody>
                  </ModalContent>
                </Modal>
                <Table variant="simple" size="md">
                  <Thead bgColor={"gray.200"}></Thead>
                  <Tbody>
                    <Tr key={assignment.id}>
                      <Table>
                        <Tr>
                          <Th>Subject</Th>
                          <Td color={"green.600"} fontWeight={"semibold"}>
                            {assignment.subject}
                          </Td>
                        </Tr>
                        <Tr>
                          <Th>Deadline</Th>
                          <Td color={"red.600"} fontWeight={"semibold"}>
                            {assignment.deadline}
                          </Td>
                        </Tr>
                        <Tr>
                          <Th>Expert Deadline</Th>
                          <Td color={"red.600"} fontWeight={"semibold"}>
                            {assignment.expertDeadline
                              ? new Date(
                                  assignment.expertDeadline[0]
                                ).toLocaleTimeString() +
                                ", " +
                                new Date(
                                  assignment.expertDeadline[0]
                                ).toDateString()
                              : ""}
                          </Td>
                        </Tr>
                        <Tr>
                          <Th>Assigned Expert</Th>
                          <Td display={"flex"} alignItems="center">
                            {localStorage.getItem("userRole") ===
                              "Super Admin" ||
                            localStorage.getItem("userRole") === "Admin"
                              ? assignment.assignedExpert
                              : assignment.assignedExpert.substring(0, 2) +
                                "****" +
                                "@" +
                                "****" +
                                ".com"}
                            <Button
                              background={"none"}
                              _focus={{ outline: "none" }}
                              _hover={{ background: "none" }}
                              color={"#dc3545"}
                              onClick={() =>
                                _expertCalling(assignment.assignedExpert)
                              }
                            >
                              <PhoneIcon />
                            </Button>
                          </Td>
                        </Tr>
                        <Tr>
                          <Th>Assigned QC</Th>
                          <Td>
                            {localStorage.getItem("userRole") ===
                              "Super Admin" ||
                            localStorage.getItem("userRole") === "Admin"
                              ? assignment.assignedQC
                              : assignment.assignedQC?.substring(0, 2) +
                                "****" +
                                "@" +
                                "****" +
                                ".com"}
                          </Td>
                        </Tr>
                        <Tr>
                          <Td p={0}>
                            <HStack>
                              <Table>
                                <Tr>
                                  <Td pl={0} pr={0}>
                                    <Button
                                      onClick={async () =>
                                        openSubmissionsModal(index)
                                      }
                                    >
                                      Submissions from Experts
                                    </Button>
                                  </Td>
                                </Tr>
                                <Tr>
                                  <Td pl={0} pr={0}>
                                    <Button
                                      onClick={async () =>
                                        markAsProofRead(index)
                                      }
                                    >
                                      Mark as Proof Read
                                    </Button>
                                  </Td>
                                </Tr>
                                <Tr>
                                  <Td pl={0} pr={0}>
                                    <Button
                                      color={"red"}
                                      onClick={async () =>
                                        openReworkModal(index)
                                      }
                                    >
                                      Send for Rework
                                    </Button>
                                  </Td>
                                </Tr>
                                <Tr>
                                  <Td pl={0} pr={0}>
                                    <Button
                                      color={"red"}
                                      onClick={async () => removeExpert(index)}
                                    >
                                      Remove Expert
                                    </Button>
                                  </Td>
                                </Tr>
                              </Table>
                            </HStack>
                          </Td>
                        </Tr>
                        <Tr>
                          <Th>
                            <Button
                              leftIcon={<RepeatIcon />}
                              onClick={async () => {
                                await _fetchAssignments();
                              }}
                            >
                              Refresh
                            </Button>
                          </Th>
                        </Tr>
                      </Table>
                    </Tr>
                  </Tbody>
                </Table>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
    </>
  );
}

export default RawSubmissionOrders;
