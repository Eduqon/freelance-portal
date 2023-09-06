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
import {
  AddIcon,
  MinusIcon,
  AttachmentIcon,
  ArrowForwardIcon,
} from "@chakra-ui/icons";
import {
  Button,
  Text,
  HStack,
  Link,
  Textarea,
  VStack,
  Box,
  Heading,
  Center,
  InputGroup,
  Input,
  InputRightElement,
  InputLeftElement,
  FormControl,
  FormLabel,
  InputLeftAddon,
  Modal,
  useDisclosure,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  InputRightAddon,
  Spinner,
} from "@chakra-ui/react";
import { useMemo } from "react";

function SubmitQuote() {
  const [assignment, setAssignment] = useState();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [pages, setPages] = useState(0);
  const [quote, setQuote] = useState("0");
  const [comments, setComments] = useState("");

  const [token, setToken] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const inputRef = useRef(null);
  const [fileName, setFileName] = useState([]);
  const [fileUrl, setFileUrl] = useState([]);

  const [stickyNotes, setStickyNotes] = useState([]);
  const [qcNotes, setQcNotes] = useState([]);

  const [operatorExpertChat, setOperatorExpertChat] = useState([]);
  const [qcExpertChat, setQcExpertChat] = useState([]);

  // const newMessageCounter = useMemo(() => {
  //   if (assignment && operatorExpertChat.length) {
  //     const lastMessage = operatorExpertChat[operatorExpertChat.length - 1];
  //     return (lastMessage && lastMessage.newMessageCount) || 0;
  //   }
  //   return 0;
  // }, [operatorExpertChat, assignment]);

  const expertMessageCounter = useMemo(() => {
    if (assignment && operatorExpertChat.length) {
      const lastMessage = operatorExpertChat[operatorExpertChat.length - 1];
      return (lastMessage && lastMessage.expertMsgCount) || 0;
    }
    return 0;
  }, [operatorExpertChat, assignment]);

  let stickyNotesList = [];
  let qcNotesList = [];

  const inputFileQCExpert = useRef(null);
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

      if (response.data.success) {
        // setNewMessageCounter(resData[0].newMessageCount);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function _fetchQcExpertChat(qcEmail, assignment_id) {
    let expertEmail = localStorage.getItem("expertEmail");
    try {
      const chatName = expertEmail + "_" + qcEmail + "_" + assignment_id;
      const chatDoc = await getDoc(doc(db, "chat", chatName));
      if (!chatDoc.exists()) {
        await setDoc(doc(db, "chat", chatName), {
          conversation: [],
        });
      }
      const unsubChat = onSnapshot(doc(db, "chat", chatName), (doc) => {
        setQcExpertChat(doc.data().conversation);
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function _fetchOperatorExpertChat(assignment_id) {
    let expertEmail = localStorage.getItem("expertEmail");
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
        setOperatorExpertChat(doc.data().conversation);
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function _submit() {
    if (isUploading) {
      window.alert("File Still being uploaded... Please Wait");
    } else {
      if (inputRef.current.name === null) {
        window.alert("Attach a File");
      } else {
        let expertToken = localStorage.getItem("expertToken");
        let config = {
          headers: { Authorization: `Bearer ${expertToken}` },
        };
        try {
          if (fileUrl !== undefined) {
            const responseDeadline = await axios.post(
              apiUrl + "/assignment/update",
              {
                _id: assignment.id,
                status: "Raw Submission",
                currentState: 5,
                order_placed_time: {
                  ...assignment.order_placed_time,
                  5: Date.now(),
                },
                delivery_file:
                  assignment.delivery_file &&
                  assignment.delivery_file[assignment.id]
                    ? {
                        [assignment.id]: [
                          ...assignment.delivery_file[assignment.id],
                          fileUrl,
                        ],
                      }
                    : {
                        [assignment.id]: [fileUrl],
                      },
                deliveryDate:
                  assignment.deliveryDate &&
                  assignment.deliveryDate[assignment.id]
                    ? {
                        [assignment.id]: [
                          ...assignment.deliveryDate[assignment.id],
                          Date.now(),
                        ],
                      }
                    : {
                        [assignment.id]: [Date.now()],
                      },
              },
              config
            );
            const response = await axios.post(
              apiUrl + "/assignment/submissions",
              {
                category:
                  assignment.status === "Expert Assigned" ? "raw" : "rework",
                _id: assignment.id,
                expertId: params.expertID,
                expertName: assignment.assignedExpertName,
                files: [
                  {
                    url: fileUrl,
                    name: fileName,
                  },
                ],
              },
              config
            );

            const createNotification = await axios.post(
              apiUrl + "/notifications",
              {
                assignmentId: assignment.id,
                read: false,
              },
              config
            );

            if (response.data.success === true) {
              window.alert("Successful Submission");
            } else {
              window.alert("response");
            }
          } else {
            window.alert("Error Uploading, Try Again!!");
          }
        } catch (err) {
          window.alert(err);
        }
      }
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

  async function uploadFile(blobName, filePath) {
    setIsUploading(true);
    await _fetchToken();
    onOpen();
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
        setFileUrl((fileUrl) => [
          "https://assignmentsanta.blob.core.windows.net/assignment-dscp/" +
            encodeURIComponent(blobName),
          ...fileUrl,
        ]);
        setIsUploading(false);
      })
      .catch(function (error) {
        setIsUploading(false);
      });
    onClose();
  }

  async function _fetchAssignmentStickyNotes() {
    let expertToken = localStorage.getItem("expertToken");

    let config = {
      headers: { Authorization: `Bearer ${expertToken}` },
    };
    const response = await axios.get(
      apiUrl +
        "/assignment/comments/fetch?assignment_id=" +
        params.assignmentID,
      config
    );
    let data = await response.data.result;
    stickyNotesList = [];
    if (data !== null) {
      for (let index = 0; index < data.notesFromOperator.length; index++) {
        stickyNotesList.push({
          id: data.notesFromOperator[index]._id,
          name: data.notesFromOperator[index].name,
          comment: data.notesFromOperator[index].comment,
        });
      }
    } else {
      console.log("Notes Not Found");
    }
    setStickyNotes(stickyNotesList);
  }

  async function _fetchAssignmentQcNotes() {
    let expertToken = localStorage.getItem("expertToken");

    let config = {
      headers: { Authorization: `Bearer ${expertToken}` },
    };
    // console.log(apiUrl + '/assignment/qc-comments/fetch?assignment_id=' + params.assignmentID)
    const response = await axios.get(
      apiUrl +
        "/assignment/qc-comments/fetch?assignment_id=" +
        params.assignmentID,
      config
    );
    let data = await response.data.result;
    qcNotesList = [];
    if (data !== null) {
      for (let index = 0; index < data.commentsFromQC.length; index++) {
        qcNotesList.push({
          id: data.commentsFromQC[index]._id,
          name: data.commentsFromQC[index].name,
          comment: data.commentsFromQC[index].comment,
        });
      }
    } else {
      console.log("Notes Not Found");
    }
    setQcNotes(qcNotesList);
  }

  useEffect(async () => {
    await _fetchToken();
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
            setEmail(email);
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
                assignedExpert: data[0].assignedExpert,
                assignedExpertName: data[0].assignedExpertName,
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
                expertDeadline: data[0].expertDeadline
                  ? data[0].expertDeadline
                  : "",
                level: data[0].level,
                reference: data[0].reference,
                description: data[0].description,
                descriptionFile: data[0].descriptionFile,
                delivery_file: data[0].delivery_file
                  ? data[0].delivery_file
                  : [],
                deliveryDate: data[0].deliveryDate ? data[0].deliveryDate : [],
                order_placed_time: data[0].order_placed_time,
                numOfPages: data[0].numOfPages,
                paid: data[0].paid,
                deadline:
                  new Date(data[0].deadline).toLocaleTimeString() +
                  ", " +
                  new Date(data[0].deadline).toDateString(),
              });
              await _fetchToken();
              await _fetchAssignmentStickyNotes();
              await _fetchAssignmentQcNotes();
              await _fetchQcExpertChat(data[0].assignedQC, data[0]._id);
              await _fetchOperatorExpertChat(data[0]._id);
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
                    expertDeadline: data[0].expertDeadline
                      ? data[0].expertDeadline
                      : "",
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
                  await _fetchAssignmentStickyNotes();
                  await _fetchAssignmentQcNotes();
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
    <Center flexDirection="column" minH={"100vh"}>
      <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader> File Upload </ModalHeader> <ModalCloseButton />
          <ModalBody pb={6}>
            File is being uploaded, please wait..{" "}
          </ModalBody>{" "}
        </ModalContent>{" "}
      </Modal>{" "}
      <Box width={"sm"} borderWidth="1px" borderRadius="md" marginTop={"20px"}>
        <Box bgColor="gray.200" p={4}>
          <Heading fontSize={"xl"}> Order Details </Heading>{" "}
        </Box>{" "}
        <VStack alignItems={"start"} margin={3} minH={"sm"}>
          <HStack padding={2}>
            <Text fontWeight={"bold"}> Ordered At: </Text>{" "}
            <Text> {assignment.createdAt} </Text>{" "}
          </HStack>{" "}
          <HStack padding={2}>
            <Text fontWeight={"bold"}> Assignment ID: </Text>{" "}
            <Text> {assignment.id} </Text>{" "}
          </HStack>{" "}
          <HStack padding={2}>
            <Text fontWeight={"bold"}> Subject: </Text>{" "}
            <Text> {assignment.subject} </Text>{" "}
          </HStack>{" "}
          <VStack padding={2} alignItems={"left"}>
            <Text fontWeight={"bold"}> Description: </Text>{" "}
            <Textarea
              width={"xs"}
              contentEditable={false}
              value={assignment.description}
              onChange={(e) => {
                console.log(e);
              }}
            >
              {" "}
              {assignment.description}{" "}
            </Textarea>{" "}
          </VStack>{" "}
          <HStack padding={2}>
            <Text fontWeight={"bold"}> Level: </Text>{" "}
            <Text> {assignment.level} </Text>{" "}
          </HStack>{" "}
          <HStack padding={2}>
            <Text fontWeight={"bold"}> Reference: </Text>{" "}
            <Text> {assignment.reference} </Text>{" "}
          </HStack>{" "}
          <HStack padding={2}>
            <Text fontWeight={"bold"}> Pages: </Text>{" "}
            <Text> {assignment.numOfPages} </Text>{" "}
          </HStack>{" "}
          <HStack padding={2}>
            <Text fontWeight={"bold"}> Deadline: </Text>{" "}
            <Text>
              {" "}
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
                : ""}{" "}
            </Text>{" "}
          </HStack>{" "}
          <VStack padding={2} alignItems={"left"} w="100%">
            {" "}
            {assignment.descriptionFile.length != 0 ? (
              assignment.descriptionFile.map((file, index) => (
                <Link
                  href={assignment.descriptionFile[index]}
                  fontWeight={"bold"}
                  color={"blue"}
                  isExternal
                >
                  {" "}
                  {assignment.descriptionFile[index].substring(62)}{" "}
                </Link>
              ))
            ) : (
              <> </>
            )}
          </VStack>{" "}
        </VStack>{" "}
      </Box>{" "}
      <Box
        display={
          assignment.status === "Quotation Asked" || "CP1 Done"
            ? "block"
            : "none"
        }
        width={"sm"}
        borderWidth="1px"
        borderRadius="md"
        marginTop={"20px"}
      >
        <VStack alignItems={"start"} margin={3}>
          <VStack padding={2} alignItems={"left"}>
            <Text fontWeight={"bold"}> Add Comments for Operator: </Text>{" "}
            <Textarea
              id="comments"
              width={"xs"}
              value={comments}
              onChange={(e) => {
                let commentsElement = document.getElementById("comments");
                setComments(commentsElement.value);
              }}
            >
              {" "}
            </Textarea>{" "}
          </VStack>{" "}
          <FormControl padding={2} id="words">
            <FormLabel> No.of Words / Pages </FormLabel>{" "}
            <InputGroup>
              <InputLeftElement h={"full"}>
                <Button
                  variant={"outline"}
                  onClick={() => {
                    if (pages <= 0) {
                      console.log("Already zero");
                    } else {
                      setPages(pages - 1);
                    }
                  }}
                >
                  <MinusIcon />
                </Button>{" "}
              </InputLeftElement>{" "}
              <Input
                type="text"
                value={"   " + pages + " Pages/" + 250 * pages + " Words"}
                contentEditable={false}
                onChange={() => console.log(pages)}
              />{" "}
              <InputRightElement h={"full"}>
                <Button
                  variant={"outline"}
                  onClick={() => {
                    setPages(pages + 1);
                  }}
                >
                  <ArrowForwardIcon />
                </Button>{" "}
              </InputRightElement>{" "}
            </InputGroup>{" "}
          </FormControl>{" "}
          <FormControl h={"full"} padding={2} id="quote">
            <FormLabel> Enter Quotation </FormLabel>{" "}
            <InputGroup>
              <InputLeftAddon>
                <Text fontWeight={"bold"}> INR </Text>{" "}
              </InputLeftAddon>{" "}
              <Input
                type="number"
                maxLength={5}
                onChange={() => {
                  let quoteElement = document.getElementById("quote");
                  setQuote(quoteElement.value);
                }}
              />{" "}
            </InputGroup>{" "}
          </FormControl>{" "}
          <Button
            w={"full"}
            onClick={async () => {
              if (pages === 0 || quote === "") {
                window.alert("Fill Up Quote & Pages");
              } else {
                try {
                  let expertToken = localStorage.getItem("expertToken");
                  let config = {
                    headers: { Authorization: `Bearer ${expertToken}` },
                  };
                  const response = await axios.post(
                    apiUrl + "/assignment/quotes/byExpert",
                    {
                      assignmentId: params.assignmentID,
                      expertQuotations: {
                        _id: params.expertID,
                        name: "Rushil Rai",
                        wordCount: pages * 250,
                        cost: quote,
                        currency: "INR",
                        comments: comments,
                      },
                    },
                    config
                  );
                  if (response.data.success) {
                    window.alert("Quote Submitted");
                  } else {
                    window.alert("Error Submitting Quote");
                  }
                } catch (error) {
                  window.alert("Error Submitting Quote");
                }
              }
            }}
          >
            {" "}
            Submit Quote{" "}
          </Button>{" "}
        </VStack>{" "}
      </Box>{" "}
      <Box
        display={
          assignment.status === "Expert Assigned" ||
          assignment.status === "Internal Rework" ||
          assignment.status === "Client Rework" ||
          assignment.status === "External Rework"
            ? "block"
            : "none"
        }
        width={"sm"}
        borderWidth="1px"
        borderRadius="md"
        marginTop={"20px"}
      >
        <VStack alignItems={"start"} margin={3}>
          <FormControl id="file">
            <FormLabel> Upload File </FormLabel>{" "}
            <InputGroup>
              <Input type="text" isReadOnly={true} value={fileName} />{" "}
              <InputRightAddon>
                <Button onClick={() => inputRef.current.click()}>
                  <AttachmentIcon />
                </Button>{" "}
                <input
                  type="file"
                  multiple={true}
                  onChange={async () => {
                    let tempFileNames = [];
                    for (
                      let index = 0;
                      index < inputRef.current.files.length;
                      index++
                    ) {
                      tempFileNames.push(inputRef.current.files[index].name);
                      await uploadFile(
                        inputRef.current.files[index].name,
                        inputRef.current.files[index]
                      );
                    }
                    setFileName(tempFileNames);
                  }}
                  ref={inputRef}
                  style={{ display: "none" }}
                />{" "}
              </InputRightAddon>{" "}
            </InputGroup>{" "}
          </FormControl>{" "}
          <Box marginTop={2} padding={"0 1rem"} width={"100%"}>
            {fileUrl?.map((_, index) => {
              return (
                <Box
                  display={"flex"}
                  alignItems={"center"}
                  justifyContent={"space-between"}
                  marginBottom={1}
                >
                  <Box width={"60%"}>
                    {_.split("/")[_.split("/").length - 1]}
                  </Box>
                  <Box>
                    <Button
                      onClick={() => {
                        const finalArr = fileUrl.filter(
                          (_, removedItemindex) => removedItemindex !== index
                        );
                        const finalFileNameList = fileName.filter(
                          (_) =>
                            _ !==
                            fileUrl[index].split("/")[
                              fileUrl[index].split("/").length - 1
                            ]
                        );
                        setFileUrl(finalArr);
                        setFileName(finalFileNameList);
                      }}
                    >
                      Remove
                    </Button>
                  </Box>
                </Box>
              );
            })}
          </Box>
          <Button
            w={"full"}
            onClick={() => {
              _submit();
            }}
          >
            {" "}
            Submit File{" "}
          </Button>{" "}
        </VStack>{" "}
      </Box>{" "}
      <Box width={"sm"} borderWidth="1px" borderRadius="md" marginTop={"20px"}>
        <Box bgColor="gray.200" p={4}>
          <Heading fontSize={"xl"}> Sticky Notes </Heading>{" "}
        </Box>{" "}
        <VStack
          alignItems={"start"}
          justifyContent={"space-between"}
          margin={3}
          minH={"sm"}
          maxH={"sm"}
        >
          <VStack width={"100%"} overflowY={"scroll"} alignItems={"start"}>
            {" "}
            {stickyNotes.length === 0 ? (
              <> </>
            ) : (
              stickyNotes.map((stickyNote, index) => (
                <Box key={index}>
                  <Text fontWeight={"bold"}> {stickyNote.name + ":"} </Text>{" "}
                  <Text
                    display={
                      stickyNote.comment.substring(0, 62) ==
                      "https://assignmentsanta.blob.core.windows.net/assignment-dscp/"
                        ? "none"
                        : "flex"
                    }
                  >
                    {" "}
                    {stickyNote.comment}{" "}
                  </Text>{" "}
                  <Link
                    color={"blue"}
                    fontWeight={"bold"}
                    display={
                      stickyNote.comment.substring(0, 62) ==
                      "https://assignmentsanta.blob.core.windows.net/assignment-dscp/"
                        ? "flex"
                        : "none"
                    }
                    href={stickyNote.comment}
                  >
                    {" "}
                    {stickyNote.comment.substring(62)}{" "}
                  </Link>{" "}
                  {/* <Divider /> */}{" "}
                </Box>
              ))
            )}{" "}
          </VStack>{" "}
        </VStack>{" "}
      </Box>{" "}
      <Box borderWidth="1px" borderRadius="md" width={"sm"} marginTop={"20px"}>
        <Box bgColor="gray.200" p={4}>
          <Heading fontSize={"xl"}> QC Notes </Heading>{" "}
        </Box>{" "}
        <VStack
          alignItems={"start"}
          justifyContent={"space-between"}
          margin={3}
          minH={"sm"}
          maxH={"sm"}
        >
          <VStack overflowY={"scroll"} alignItems={"start"} width={"100%"}>
            {" "}
            {qcNotes.length === 0 ? (
              <> </>
            ) : (
              qcNotes.map((qcNote, index) => (
                <Box key={index}>
                  <Text fontWeight={"bold"}> {qcNote.name + ":"} </Text>{" "}
                  <Text
                    display={
                      qcNote.comment.substring(0, 62) ==
                      "https://assignmentsanta.blob.core.windows.net/assignment-dscp/"
                        ? "none"
                        : "flex"
                    }
                  >
                    {" "}
                    {qcNote.comment}{" "}
                  </Text>{" "}
                  <Link
                    color={"blue"}
                    fontWeight={"bold"}
                    display={
                      qcNote.comment.substring(0, 62) ==
                      "https://assignmentsanta.blob.core.windows.net/assignment-dscp/"
                        ? "flex"
                        : "none"
                    }
                    href={qcNote.comment}
                  >
                    {" "}
                    {qcNote.comment.substring(62)}{" "}
                  </Link>{" "}
                  {/* <Divider /> */}{" "}
                </Box>
              ))
            )}{" "}
          </VStack>{" "}
        </VStack>{" "}
      </Box>{" "}
      <Box
        display={assignment.assignedQC !== undefined ? "block" : "none"}
        borderWidth="1px"
        borderRadius="md"
        width={"sm"}
        marginTop={"20px"}
      >
        <Box p={4} bgColor="gray.200">
          <HStack>
            <Heading fontSize={"xl"}> Expert Chat with QC </Heading>{" "}
          </HStack>{" "}
        </Box>{" "}
        <VStack
          alignItems={"start"}
          justifyContent={"space-between"}
          margin={3}
          minH={"sm"}
          maxH={"sm"}
        >
          <VStack overflowY={"scroll"} alignItems={"start"} width={"100%"}>
            {" "}
            {qcExpertChat.map((messageItem, index) => (
              <Box
                display={
                  messageItem.type === "TEXT"
                    ? "flex"
                    : messageItem.type === "MEDIA"
                    ? "flex"
                    : "none"
                }
                alignSelf={
                  messageItem.user === assignment.assignedExpert
                    ? "flex-end"
                    : "flex-start"
                }
                flexWrap={true}
                padding={2}
                borderRadius={"md"}
                maxWidth="70%"
                bgColor={
                  messageItem.user === assignment.assignedExpert
                    ? "blue.100"
                    : "green.100"
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
            <Input type="text" id="addChatQCExpert" />
            <Input
              type="file"
              id="addFileQCExpert"
              onChange={async () => {
                let fileUrl = "";
                if (inputFileQCExpert) {
                  onOpen();
                  try {
                    var config = {
                      method: "put",
                      url:
                        "https://assignmentsanta.blob.core.windows.net/assignment-dscp/" +
                        encodeURIComponent(
                          inputFileQCExpert.current.files[0].name
                        ) +
                        "?" +
                        token,
                      headers: {
                        "x-ms-blob-type": "BlockBlob",
                      },
                      data: inputFileQCExpert.current.files[0],
                    };

                    axios(config)
                      .then(async function (response) {
                        fileUrl =
                          "https://assignmentsanta.blob.core.windows.net/assignment-dscp/" +
                          encodeURIComponent(
                            inputFileQCExpert.current.files[0].name
                          );
                        const message = await updateDoc(
                          doc(
                            db,
                            "chat",
                            assignment.assignedExpert +
                              "_" +
                              assignment.assignedQC +
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
              ref={inputFileQCExpert}
              style={{ display: "none" }}
            />{" "}
            <InputLeftElement h={"full"}>
              <Button
                id="attachButton"
                onClick={async () => {
                  inputFileQCExpert.current.click();
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
                  let textInput = document.getElementById("addChatQCExpert");
                  if (textInput.value !== "" && textInput.value !== undefined) {
                    if (Regex.test(textInput.value)) {
                      window.alert(
                        "Sharing Phone Numbers through Chat is not allowed"
                      );
                    } else {
                      const message = await updateDoc(
                        doc(
                          db,
                          "chat",
                          assignment.assignedExpert +
                            "_" +
                            assignment.assignedQC +
                            "_" +
                            assignment.id
                        ),
                        {
                          conversation: arrayUnion({
                            msg: textInput.value,
                            time: Date.now(),
                            type: "TEXT",
                            user: assignment.assignedExpert,
                          }),
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
      <Box
        borderWidth="1px"
        borderRadius="md"
        width={"sm"}
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
          margin={3}
          minH={"sm"}
          maxH={"sm"}
        >
          <VStack overflowY={"scroll"} alignItems={"start"} width={"100%"}>
            {" "}
            {operatorExpertChat.map((messageItem, index) => (
              <>
                {messageItem.user !== assignment.assignedExpert && (
                  <Text
                    display={messageItem.type === "TEXT" ? "flex" : "none"}
                    alignSelf={
                      messageItem.user === assignment.assignedExpert
                        ? "flex-end"
                        : "flex-start"
                    }
                    maxWidth={"100%"}
                    color={"gray.500"}
                    fontSize={"sm"}
                  >
                    {messageItem.user}
                  </Text>
                )}
                <Box
                  display={
                    messageItem.type === "TEXT"
                      ? "flex"
                      : messageItem.type === "MEDIA"
                      ? "flex"
                      : "none"
                  }
                  alignSelf={
                    messageItem.user === assignment.assignedExpert
                      ? "flex-end"
                      : "flex-start"
                  }
                  flexWrap={true}
                  padding={2}
                  borderRadius={"md"}
                  maxWidth="70%"
                  bgColor={
                    messageItem.user === assignment.assignedExpert
                      ? "blue.100"
                      : "green.100"
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
              </>
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
                      const message = await updateDoc(
                        doc(
                          db,
                          "chat",
                          assignment.assignedExpert +
                            "_" +
                            "operator_expert_chat" +
                            "_" +
                            assignment.id
                        ),
                        {
                          conversation: arrayUnion({
                            msg: textInput.value,
                            time: Date.now(),
                            type: "TEXT",
                            user: assignment.assignedExpert,
                            expertMsgCount: expertMessageCounter + 1,
                            newMessageCount: 0,
                            operatorMsgCount: 0,
                          }),
                        }
                      );

                      const sendMessage = await axios.post(
                        apiUrl + "/messages",
                        {
                          id: assignment.id,
                          expertEmail: assignment.assignedExpert,
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

export default SubmitQuote;
