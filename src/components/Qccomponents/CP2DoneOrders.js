import {
    ChatIcon,
    RepeatIcon,
    ArrowForwardIcon,
    AttachmentIcon,
    ViewOffIcon,
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
    Link,
    useDisclosure,
    Modal,
    ModalContent,
    ModalOverlay,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    HStack,
    VStack,
    Heading,
    Text,
    InputGroup,
    Input,
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
  import { useEffect, useState, useRef } from "react";
  // import { useRouter } from "next/router";
  import { useNavigate } from "react-router-dom";
  import { arrayUnion, doc, updateDoc } from "firebase/firestore";
  import { apiUrl, callingNumbers } from "../../services/contants";
  import { db } from "../../services/firebase";
  
  function CP2DoneOrders({
    confirmOrderAssignedExpertMessages,
    operatorExpertChat,
  }) {
    const [assignments, setAssignments] = useState([]);
  
    const [selectedIndex, setSelectedIndex] = useState();
    const [messages, setMessages] = useState([]);
    const [id, setId] = useState("");
    const inputFileOperatorExpert = useRef(null);
    const { onOpen, onClose } = useDisclosure();
    const [token, setToken] = useState("");
    // const [messageData, setMessageData] = useState([]);
    const [loader, setLoader] = useState(true);
    const [userID, setUserID] = useState("");
  
    const MessagesModalDis = useDisclosure();
    const ReplyMessageModalDis = useDisclosure();
    const CallingModalDis = useDisclosure();
  
    let assignmentList = [];
  
    let navigate = useNavigate();
  
    useEffect(() => {
      (async () => {
        await _fetchToken();
      })();
    }, []);
  
    useEffect(() => {
      _fetchAssignments();
    }, []);
  
    async function _fetchAssignments() {
      try {
        let userToken = localStorage.getItem("userToken");
        let userEmail = localStorage.getItem("userEmail");
  
        if (userToken == null) {
          navigate("/admin/login");
        }
  
        let config = {
          headers: { Authorization: `Bearer ${userToken}` },
        };
        const response = await axios.get(
          apiUrl + "/assignment/fetch?status=CP2%20Done",
          config
        );
        let data = response.data.assignmentData;
        assignmentList = [];
        if (data.length !== 0) {
          for (let index = 0; index < data.length; index++) {
            assignmentList.push({
              id: data[index]._id,
              client_id: data[index].client_id,
              subject: data[index].subject,
              status: data[index].status,
              quotation: data[index].quotation,
              currencyOfQuote: data[index].currencyOfQuote,
              level: data[index].level,
              reference: data[index].reference,
              description: data[index].description,
              descriptionFile: data[index].descriptionFile,
              numOfPages: data[index].numOfPages,
              paid: data[index].paid,
              countryCode: data[index].countrycode,
              contact_no: data[index].contact_no,
              cp1PaymentId: data[index].cp1PaymentId,
              cp2PaymentId: data[index].cp2PaymentId,
              deadline:
                new Date(data[index].deadline).toLocaleTimeString() +
                ", " +
                new Date(data[index].deadline).toDateString(),
              expertDeadline:
                new Date(data[index].expertDeadline).toLocaleTimeString() +
                ", " +
                new Date(data[index].expertDeadline).toDateString(),
              amountStatus: data[index].amountStatus,
              quoteAmountStatus: data[index].quoteAmountStatus,
            });
          }
        } else {
          console.log("No CP1 Pending Orders");
        }
        setLoader(false);
        setAssignments(assignmentList);
      } catch (err) {
        console.log(err);
      }
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
      MessagesModalDis.onOpen();
    }
  
    function MessageModal() {
      let message;
      if (
        assignments &&
        assignments.length !== 0 &&
        confirmOrderAssignedExpertMessages &&
        confirmOrderAssignedExpertMessages.length !== 0 &&
        selectedIndex
      ) {
        message = confirmOrderAssignedExpertMessages.filter((data) => {
          return assignments[selectedIndex].id === data.id;
        });
      }
  
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
                  {message && message.length === 0 ? (
                    <></>
                  ) : (
                    message &&
                    message.map((msg, index) => (
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
  
    return (
      <>
        <MessageModal />
        <ReplyMessageModal />
        <CallingModal />
        <Table
          variant="simple"
          size="md"
          display={{ base: "none", sm: "block", md: "block" }}
        >
          <Thead bgColor={"gray.200"}>
            <Tr>
              <Th>Id</Th>
              <Th>Student Email</Th>
              <Th>Student No.</Th>
              <Th>Subject</Th>
              <Th>Order Quote</Th>
              <Th>Amount Paid</Th>
              <Th>Deadline</Th>
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
                  <Td fontWeight={"semibold"} paddingTop={9}>
                    <Box display={"flex"} alignItems={"center"}>
                      <Link href={"/admin/assignment_details/" + assignment.id}>
                        {assignment.id}
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
                              data.chat.length !== 0 &&
                              data.chat[data.chat.length - 1].newMessageCount !==
                                0
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
                    </Box>
                  </Td>
                  <Td>
                    {/* {localStorage.getItem("userRole") === "Super Admin" ||
                    localStorage.getItem("userRole") === "Admin"
                      ? assignment.client_id
                      : assignment.client_id.substring(0, 2) +
                        "****" +
                        "@" +
                        "****" +
                        ".com"} */}
                        {
                          assignment.client_id.substring(0, 2) +
                          "****" +
                          "@" +
                          "****" +
                          ".com"
                        }
                  </Td>
                  <Td textAlign={"center"}>
                    {/* {localStorage.getItem("userRole") === "Super Admin" ||
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
                        String(assignment.contact_no).substring(8, 10)} */}
                        {
                          "+" +
                          String(assignment.countryCode) +
                          " " +
                          String(assignment.contact_no).substring(0, 2) +
                          "********" +
                          String(assignment.contact_no).substring(8, 10)
                        }
                  </Td>
                  <Td color={"green.600"} fontWeight={"semibold"}>
                    {assignment.subject}
                  </Td>
                  <Td
                    fontWeight={"bold"}
                    color={
                      assignment.cp1PaymentId === "External Payment"
                        ? "red"
                        : "green"
                    }
                  >
                    {assignment &&
                    assignment.quoteAmountStatus &&
                    assignment.quoteAmountStatus[userID] === "Approved" ? (
                      <Button
                        onClick={async () => {
                          try {
                            const response = await axios.get(
                              apiUrl +
                                `/expert/assignment/showQuoteAmount/reply?approved=${false}&expertId=Arnabgoswami1193@gmail.com&assignmentId=${
                                  assignment["id"]
                                }&operatorID=${userID}`
                            );
                            let resdata = response.data;
                            if (resdata.success) {
                              _fetchAssignments();
                            }
                          } catch (err) {
                            console.log(err);
                          }
                        }}
                        background="none"
                        _hover={{
                          background: "none",
                        }}
                        _focus={{
                          boxShadow: "none",
                        }}
                      >
                        {assignment.quotation}
                      </Button>
                    ) : (
                      <Button
                        onClick={async () => {
                          let userToken = localStorage.getItem("userToken");
                          if (userToken == null) {
                            navigate("/admin/login");
                          }
  
                          let config = {
                            headers: { Authorization: `Bearer ${userToken}` },
                          };
                          try {
                            const response = await axios.post(
                              apiUrl + "/expert/assignment/showQuoteAmount",
                              {
                                assignmentId: assignment.id,
                              },
                              config
                            );
                            let resdata = response.data;
                            if (resdata.success) {
                              window.alert("Show Quote Amount Asked");
                            }
                          } catch (err) {
                            console.log(err);
                          }
                        }}
                        background="none"
                        _hover={{
                          background: "none",
                        }}
                        _focus={{
                          boxShadow: "none",
                        }}
                      >
                        <ViewOffIcon />
                      </Button>
                    )}
                  </Td>
                  <Td
                    fontWeight={"bold"}
                    color={
                      assignment.cp1PaymentId === "External Payment"
                        ? "red"
                        : "green"
                    }
                  >
                    {assignment &&
                    assignment.amountStatus &&
                    assignment.amountStatus[userID] === "Approved" ? (
                      <Button
                        onClick={async () => {
                          try {
                            const response = await axios.get(
                              apiUrl +
                                `/expert/assignment/showAmount/reply?approved=${false}&expertId=Arnabgoswami1193@gmail.com&assignmentId=${
                                  assignment["id"]
                                }&operatorID=${userID}`
                            );
                            let resdata = response.data;
                            if (resdata.success) {
                              _fetchAssignments();
                            }
                          } catch (err) {
                            console.log(err);
                          }
                        }}
                        background="none"
                        _hover={{
                          background: "none",
                        }}
                        _focus={{
                          boxShadow: "none",
                        }}
                      >
                        {assignment.paid}
                      </Button>
                    ) : (
                      <Button
                        onClick={async () => {
                          let userToken = localStorage.getItem("userToken");
                          if (userToken == null) {
                            navigate("/admin/login");
                          }
  
                          let config = {
                            headers: { Authorization: `Bearer ${userToken}` },
                          };
                          try {
                            const response = await axios.post(
                              apiUrl + "/expert/assignment/showAmount",
                              {
                                assignmentId: assignment.id,
                              },
                              config
                            );
                            let resdata = response.data;
                            if (resdata.success) {
                              window.alert("Show Amount Asked");
                            }
                          } catch (err) {
                            console.log(err);
                          }
                        }}
                        background="none"
                        _hover={{
                          background: "none",
                        }}
                        _focus={{
                          boxShadow: "none",
                        }}
                      >
                        <ViewOffIcon />
                      </Button>
                    )}
                  </Td>
                  <Td color={"red.600"} fontWeight={"semibold"}>
                    {assignment.deadline}
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
        {/* accodion for mobile */}
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
                <AccordionPanel pb={0}>
                  <Table variant="simple" size="md">
                    <Thead bgColor={"gray.200"} className="pa-ze">
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
                    </Thead>
                    <Tbody>
                      <Tr key={assignment.id}>
                        <Table className="pa-z">
                          <Tr>
                            <Th>Student Email</Th>
                            <Td>
                              {/* {localStorage.getItem("userRole") ===
                                "Super Admin" ||
                              localStorage.getItem("userRole") === "Admin"
                                ? assignment.client_id
                                : assignment.client_id.substring(0, 2) +
                                  "****" +
                                  "@" +
                                  "****" +
                                  ".com"} */}
                                  {
                                    assignment.client_id.substring(0, 2) +
                                    "****" +
                                    "@" +
                                    "****" +
                                    ".com"
                                  }
                            </Td>
                          </Tr>
                          <Tr>
                            <Th>Subject</Th>
                            <Td color={"green.600"} fontWeight={"semibold"}>
                              {assignment.subject}
                            </Td>
                          </Tr>
                          <Tr>
                            <Th>Order Quote</Th>
                            <Td
                              fontWeight={"bold"}
                              color={
                                assignment.cp1PaymentId === "External Payment"
                                  ? "red"
                                  : "green"
                              }
                            >
                              {assignment.quotation}
                            </Td>
                          </Tr>
                          <Tr>
                            <Th>Amount Paid</Th>
                            <Td
                              fontWeight={"bold"}
                              color={
                                assignment.cp1PaymentId === "External Payment"
                                  ? "red"
                                  : "green"
                              }
                            >
                              {assignment.paid}
                            </Td>
                          </Tr>
                          <Tr>
                            <Th>Deadline</Th>
                            <Td color={"red.600"} fontWeight={"semibold"}>
                              {assignment.deadline}
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
  
  export default CP2DoneOrders;
  