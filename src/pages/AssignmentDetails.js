import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { apiUrl } from "../services/contants";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  Circle,
  Spacer,
  InputLeftElement,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormLabel,
  FormControl,
  InputRightAddon,
  ModalFooter,
  Wrap,
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  Checkbox,
  Spinner,
} from "@chakra-ui/react";
import {
  RepeatIcon,
  ArrowForwardIcon,
  AttachmentIcon,
  AddIcon,
} from "@chakra-ui/icons";
import LoginLayout from "./LoginLayout";

function AssignmentDetails() {
  const [assignment, setAssignment] = useState();
  const [loading, setLoading] = useState(true);

  const [stickyNotes, setStickyNotes] = useState([]);
  const [qcNotes, setQcNotes] = useState([]);
  const [actions, setActions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [assignmentFiles, setAssignmentFiles] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [salesChat, setSalesChat] = useState([]);
  const [salesViewChat, setSalesViewChat] = useState([]);
  const [operatorExpertChat, setOperatorExpertChat] = useState([]);
  const [operatorExpertViewChat, setOperatorExpertViewChat] = useState([]);
  const [qcExpertChat, setQcExpertChat] = useState([]);
  const [qcExpertViewChat, setQcExpertViewChat] = useState([]);

  const [id, setId] = useState("");
  const [clientId, setChatClientId] = useState("");

  let params = useParams();
  let navigate = useNavigate();

  let stickyNotesList = [];
  let actionsList = [];
  let qcNotesList = [];
  let submissionsList = [];
  let assignmentFilesList = [];
  let quotationsList = [];

  const [userRole, setUserRole] = useState("");

  const inputFileQCExpert = useRef(null);
  const inputFileOperatorExpert = useRef(null);
  const inputFileSalesClient = useRef(null);
  const inputFileStickyNotes = useRef(null);
  const inputFileQCNotes = useRef(null);
  const [token, setToken] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [assignmentFileName, setAssignmentFileName] = useState("");
  const [assignmentFileUrl, setAssignmentFileUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    _fetchAssignmentDetails();
    setUserRole(localStorage.getItem("userRole"));
    setTabIndex(Number(localStorage.getItem("tabIndex")));
  }, [params]);

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

  async function _fetchQuotations() {
    try {
      let userToken = localStorage.getItem("expertToken");
      if (userToken == null) {
        navigate("/expert/login");
      }

      let config = {
        headers: { Authorization: `Bearer ${userToken}` },
      };
      const response = await axios.get(
        apiUrl +
          "/assignment/quotes/fetch?assignment_id=" +
          params.assignmentID,
        config
      );
      let data = await response.data.result.expertQuotations;
      quotationsList = [];
      if (data.length !== 0) {
        for (let index = 0; index < data.length; index++) {
          quotationsList.push({
            _id: data[index]._id,
            wordCount: data[index].wordCount,
            cost: data[index].cost,
            currency: data[index].currency,
            comments: data[index].comments,
          });
        }
      } else {
        console.log("No Experts Found");
      }
      setQuotations(quotationsList);
    } catch (err) {
      console.log(err);
    }
  }

  async function _fetchAssignmentFiles() {
    let userToken = localStorage.getItem("expertToken");

    let config = {
      headers: { Authorization: `Bearer ${userToken}` },
    };
    const response = await axios.get(
      apiUrl +
        "/assignment/assignmentFiles/fetch?assignment_id=" +
        params.assignmentID,
      config
    );
    let data = await response.data.result.assignmentFiles;
    assignmentFilesList = [];
    if (data !== null) {
      for (let index = 0; index < data.length; index++) {
        assignmentFilesList.push({
          _id: data[index]._id,
          userId: data[index].userId,
          name: data[index].name,
          url: data[index].url,
          category: data[index].category,
          createdAt:
            new Date(data[index].createdAt).toLocaleTimeString() +
            ", " +
            new Date(data[index].createdAt).toDateString(),
        });
      }
    } else {
      console.log("Activities Not Found");
    }
    setAssignmentFiles(assignmentFilesList.reverse());
  }

  async function _fetchSubmissions() {
    let userToken = localStorage.getItem("expertToken");

    let config = {
      headers: { Authorization: `Bearer ${userToken}` },
    };
    const response = await axios.get(
      apiUrl +
        "/assignment/submissions/fetch?assignment_id=" +
        params.assignmentID,
      config
    );
    let data = await response.data.result.workSubmissions;
    submissionsList = [];
    if (data !== null) {
      for (let index = 0; index < data.length; index++) {
        submissionsList.push({
          _id: data[index]._id,
          expertId: data[index].expertId,
          name: data[index].name,
          url: data[index].url,
          category: data[index].category,
          createdAt:
            new Date(data[index].createdAt).toLocaleTimeString() +
            ", " +
            new Date(data[index].createdAt).toDateString(),
        });
      }
    } else {
      console.log("Activities Not Found");
    }
    setSubmissions(submissionsList.reverse());
  }

  async function _fetchActions() {
    let userToken = localStorage.getItem("expertToken");

    let config = {
      headers: { Authorization: `Bearer ${userToken}` },
    };
    const response = await axios.get(
      apiUrl +
        "/assignment/activity/fetch?assignment_id=" +
        params.assignmentID,
      config
    );
    let data = await response.data.result;
    actionsList = [];
    if (data !== null) {
      for (let index = 0; index < data.activity.length; index++) {
        actionsList.push({
          _id: data.activity[index]._id,
          role: data.activity[index].role,
          user: data.activity[index].user,
          uid: data.activity[index].uid,
          action: data.activity[index].action,
          at:
            new Date(data.activity[index].createdAt).toLocaleTimeString() +
            ", " +
            new Date(data.activity[index].createdAt).toDateString(),
        });
      }
    } else {
      console.log("Activities Not Found");
    }
    setActions(actionsList.reverse());
  }

  async function _fetchAssignmentQcNotes() {
    let userToken = localStorage.getItem("expertToken");

    let config = {
      headers: { Authorization: `Bearer ${userToken}` },
    };
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

  async function _addAssignmentQcNote() {
    let userToken = localStorage.getItem("expertToken");
    let userEmail = localStorage.getItem("userEmail");
    let userName = localStorage.getItem("userName");

    let qcBox = document.getElementById("addQc");

    let config = {
      headers: { Authorization: `Bearer ${userToken}` },
    };
    if (qcBox.value === "") {
      window.alert("Notes cannot be empty");
    } else {
      const response = await axios.post(
        apiUrl + "/assignment/comments/QCToExpert",
        {
          assignmentId: params.assignmentID,
          expertId: assignment.assignedExpert,
          commentsFromQC: {
            _id: userEmail,
            name: userName,
            comment: qcBox.value,
          },
        },
        config
      );
      if (response.data.success) {
        await _fetchAssignmentQcNotes();
        qcBox.value = "";
      } else {
        console.log(response);
      }
    }
  }

  async function _fetchAssignmentStickyNotes() {
    let userToken = localStorage.getItem("expertToken");

    let config = {
      headers: { Authorization: `Bearer ${userToken}` },
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

  async function _addAssignmentStickyNote() {
    let userToken = localStorage.getItem("expertToken");
    let userEmail = localStorage.getItem("userEmail");
    let userName = localStorage.getItem("userName");

    let stickyBox = document.getElementById("addSticky");

    let config = {
      headers: { Authorization: `Bearer ${userToken}` },
    };
    if (stickyBox.value === "") {
      window.alert("Notes cannot be empty");
    } else {
      const response = await axios.post(
        apiUrl + "/assignment/comments/operatorToExpert",
        {
          assignmentId: params.assignmentID,
          expertId: assignment.assignedExpert,
          notesFromOperator: {
            _id: userEmail,
            name: userName,
            comment: stickyBox.value,
          },
        },
        config
      );
      if (response.data.success) {
        await _fetchAssignmentStickyNotes();
        stickyBox.value = "";
      } else {
        console.log(response);
      }
    }
  }

  async function _fetchAssignmentDetails() {
    try {
      let userToken = localStorage.getItem("expertToken");
      if (userToken == null) {
        navigate("/expert/login");
      }

      let config = {
        headers: { Authorization: `Bearer ${userToken}` },
      };
      console.log({ id: params.assignmentID, userToken });
      //   return;
      const response = await axios.get(
        apiUrl + "/assignment/fetch?_id=" + params.assignmentID,
        config
      );
      let data = await response.data.assignmentData;
      if (data.length !== 0) {
        setAssignment({
          id: data[0]._id,
          assignedOperator: data[0].assignedOperator,
          assignedExpert: data[0].assignedExpert,
          assignedSales: data[0].assignedSales,
          assignedQC: data[0].assignedQC,
          client_id: data[0].client_id,
          subject: data[0].subject,
          status: data[0].status,
          quotation: data[0].quotation,
          currencyOfQuote: data[0].currencyOfQuote,
          order_placed_time: data[0].order_placed_time,
          createdAt:
            new Date(data[0].createdAt).toLocaleTimeString() +
            ", " +
            new Date(data[0].createdAt).toDateString(),
          expertDeadline: data[0].expertDeadline
            ? data[0].expertDeadline[data[0]._id]
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
        setChatClientId(data[0].client_id);
        await _fetchSalesChatView(
          data[0].client_id,
          data[0].assignedSales,
          data[0]._id
        );
        await _fetchSalesChat(data[0].client_id, data[0]._id);
        await _fetchOperatorExpertChatView(
          data[0].assignedExpert,
          data[0].assignedOperator,
          data[0]._id
        );
        await _fetchOperatorExpertChat(data[0].assignedExpert, data[0]._id);
        await _fetchQcExpertChatView(
          data[0].assignedExpert,
          data[0].assignedQC,
          data[0]._id
        );
        await _fetchQcExpertChat(data[0].assignedExpert, data[0]._id);
        await _fetchAssignmentStickyNotes();
        await _fetchAssignmentQcNotes();
        await _fetchActions();
        await _fetchSubmissions();
        await _fetchAssignmentFiles();
        await _fetchQuotations();
        await _fetchToken();
      } else {
        console.log("Assignment Not Found");
      }
      setLoading(false);
    } catch (err) {
      console.log(err);
    }
  }

  async function _fetchSalesChat(clientEmail, assignment_id) {
    let userEmail = localStorage.getItem("userEmail");
    setId(userEmail);
    try {
      const chatName = clientEmail + "_" + userEmail + "_" + assignment_id;
      const chatDoc = await getDoc(doc(db, "chat", chatName));
      if (!chatDoc.exists()) {
        await setDoc(doc(db, "chat", chatName), {
          conversation: [],
        });
      }
      const unsubChat = onSnapshot(doc(db, "chat", chatName), (doc) => {
        setSalesChat(doc.data().conversation);
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function _fetchSalesChatView(clientEmail, salesEmail, assignment_id) {
    if (
      localStorage.getItem("userRole") === "Admin" ||
      localStorage.getItem("userRole") === "Super Admin"
    ) {
      try {
        const chatName = clientEmail + "_" + salesEmail + "_" + assignment_id;
        const chatDoc = await getDoc(doc(db, "chat", chatName));
        if (!chatDoc.exists()) {
          await setDoc(doc(db, "chat", chatName), {
            conversation: [],
          });
        }
        const unsubChat = onSnapshot(doc(db, "chat", chatName), (doc) => {
          setSalesViewChat(doc.data().conversation);
        });
      } catch (error) {}
    }
  }

  async function _fetchOperatorExpertChat(expertEmail, assignment_id) {
    let userEmail = localStorage.getItem("userEmail");
    try {
      const chatName = expertEmail + "_" + userEmail + "_" + assignment_id;
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

  async function _fetchOperatorExpertChatView(
    expertEmail,
    operatorEmail,
    assignment_id
  ) {
    if (
      localStorage.getItem("userRole") === "Admin" ||
      localStorage.getItem("userRole") === "Super Admin"
    ) {
      try {
        const chatName =
          expertEmail + "_" + operatorEmail + "_" + assignment_id;
        const chatDoc = await getDoc(doc(db, "chat", chatName));
        if (!chatDoc.exists()) {
          await setDoc(doc(db, "chat", chatName), {
            conversation: [],
          });
        }
        const unsubChat = onSnapshot(doc(db, "chat", chatName), (doc) => {
          setOperatorExpertViewChat(doc.data().conversation);
        });
      } catch (error) {
        console.log(error);
      }
    }
  }

  async function _fetchQcExpertChat(expertEmail, assignment_id) {
    let userEmail = localStorage.getItem("userEmail");
    try {
      const chatName = expertEmail + "_" + userEmail + "_" + assignment_id;
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
      //console.log(error);
    }
  }

  async function _fetchQcExpertChatView(expertEmail, qcEmail, assignment_id) {
    if (
      localStorage.getItem("userRole") === "Admin" ||
      localStorage.getItem("userRole") === "Super Admin"
    ) {
      try {
        const chatName = expertEmail + "_" + qcEmail + "_" + assignment_id;
        const chatDoc = await getDoc(doc(db, "chat", chatName));
        if (!chatDoc.exists()) {
          await setDoc(doc(db, "chat", chatName), {
            conversation: [],
          });
        }
        const unsubChat = onSnapshot(doc(db, "chat", chatName), (doc) => {
          setQcExpertViewChat(doc.data().conversation);
        });
      } catch (error) {
        console.log(error);
      }
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
        setAssignmentFileUrl(
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

  const SendToClientModalDis = useDisclosure();

  async function openSendToClientModal() {
    SendToClientModalDis.onOpen();
  }

  function SendToClientModal() {
    let checkedListTemp = [];

    const [isCustomMail, setIsCustomMail] = useState(false);

    return (
      <Modal
        size={"2xl"}
        onClose={SendToClientModalDis.onClose}
        isOpen={SendToClientModalDis.isOpen}
        onOpen={SendToClientModalDis.onOpen}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select the Files to Send</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Table variant="simple" size="sm">
              <Thead bgColor={"gray.200"}>
                <Tr>
                  <Th>File</Th>
                  <Th>Category</Th>
                  <Th>User</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {assignmentFiles.length === 0 ? (
                  <></>
                ) : (
                  assignmentFiles.map((assignmentFile, index) => (
                    <Tr key={index}>
                      <Td maxW={"100px"}>
                        <Link isExternal={true} href={assignmentFile.url}>
                          {assignmentFile.name}
                        </Link>
                      </Td>
                      <Td>{assignmentFile.category}</Td>
                      <Td>{assignmentFile.userId}</Td>
                      <Td>
                        <Checkbox
                          className="fileCheckBox"
                          value={{
                            category: assignmentFile.category,
                            url: assignmentFile.url,
                            name: assignmentFile.name,
                          }}
                          onChange={(e) => {
                            e.target.checked
                              ? checkedListTemp.push({
                                  category: assignmentFile.category,
                                  url: assignmentFile.url,
                                  name: assignmentFile.name,
                                })
                              : checkedListTemp.splice(
                                  checkedListTemp.indexOf(e.target.value)
                                );
                          }}
                        />
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Checkbox
                value={isCustomMail}
                onChange={(e) => {
                  e.target.checked
                    ? setIsCustomMail(true)
                    : setIsCustomMail(false);
                }}
              >
                Custom Email
              </Checkbox>
              <Input
                display={isCustomMail ? "block" : "none"}
                type={"text"}
                id={"customMail"}
              />
              <Button
                onClick={async () => {
                  if (checkedListTemp.length === 0) {
                    window.alert("Select Files to Send");
                  } else {
                    let userToken = localStorage.getItem("expertToken");
                    let config = {
                      headers: { Authorization: `Bearer ${userToken}` },
                    };
                    if (isCustomMail) {
                      let customMail = document.getElementById("customMail");
                      if (customMail.value === "") {
                        window.alert("Enter Email");
                      } else {
                        try {
                          const responseDeadline = await axios.post(
                            apiUrl + "/assignment/update",
                            {
                              _id: params.assignmentID,
                              status: "CP2 Done",
                              currentState: 8,
                              order_placed_time: {
                                ...assignment.order_placed_time,
                                8: Date.now(),
                              },
                              final_delivery: checkedListTemp,
                            },
                            config
                          );
                          let response = await axios.post(
                            apiUrl + "/assignment/final-delivery",
                            {
                              _id: params.assignmentID,
                              emailToDeliver: customMail.value,
                              fileLinks: checkedListTemp,
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
                          SendToClientModalDis.onClose();
                          window.alert("Files Sent to Client");
                        } catch (error) {}
                      }
                    } else {
                      try {
                        const responseDeadline = await axios.post(
                          apiUrl + "/assignment/update",
                          {
                            _id: params.assignmentID,
                            status: "CP2 Done",
                            currentState: 8,
                            order_placed_time: {
                              ...assignment.order_placed_time,
                              8: Date.now(),
                            },
                            final_delivery: checkedListTemp,
                          },
                          config
                        );
                        let response = await axios.post(
                          apiUrl + "/assignment/final-delivery",
                          {
                            _id: params.assignmentID,
                            emailToDeliver: assignment.client_id,
                            fileLinks: checkedListTemp,
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
                        SendToClientModalDis.onClose();
                        window.alert("Files Sent to Client");
                      } catch (error) {}
                    }
                  }
                }}
              >
                Send
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  const AssignmentFileUploadModalDis = useDisclosure();

  async function openAssignmentFileUploadModal() {
    setAssignmentFileName("");
    setAssignmentFileUrl("");
    AssignmentFileUploadModalDis.onOpen();
  }

  function AssignmentFileUploadModal() {
    return (
      <Modal
        size={"2xl"}
        onClose={AssignmentFileUploadModalDis.onClose}
        isOpen={AssignmentFileUploadModalDis.isOpen}
        onOpen={AssignmentFileUploadModalDis.onOpen}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Assignment Files</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl id="file">
              <FormLabel>1) Choose Upload File</FormLabel>
              <InputGroup>
                <Input
                  type="text"
                  isReadOnly={true}
                  value={assignmentFileName}
                />
                <InputRightAddon>
                  <Button onClick={() => inputRef.current.click()}>
                    <AttachmentIcon />
                  </Button>
                  <input
                    type="file"
                    onChange={async () => {
                      setAssignmentFileName(inputRef.current.files[0].name);
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
              <FormLabel>2) Enter File Category</FormLabel>
              <Input type={"text"} id="fileCategory"></Input>
            </InputGroup>
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={async () => {
                if (isUploading) {
                  window.alert(
                    "File is still uploading... Please wait and try again"
                  );
                } else {
                  let fileCategory = document.getElementById("fileCategory");
                  if (fileCategory.value === "") {
                    window.alert("Please Enter File Category");
                  } else {
                    let userToken = localStorage.getItem("expertToken");
                    let config = {
                      headers: { Authorization: `Bearer ${userToken}` },
                    };
                    try {
                      let response = await axios.post(
                        apiUrl + "/assignment/assignmentFiles",
                        {
                          _id: params.assignmentID,
                          files: [
                            {
                              category: fileCategory.value,
                              url: assignmentFileUrl,
                              name: assignmentFileName,
                            },
                          ],
                        },
                        config
                      );
                      AssignmentFileUploadModalDis.onClose();
                      _fetchAssignmentDetails();
                    } catch (error) {}
                  }
                }
              }}
            >
              Upload
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  if (assignment === undefined || assignment.length === 0) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }
  return (
    <>
      <LoginLayout />
      <VStack alignItems={"start"} margin={5}>
        <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>File Upload</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>File is being uploaded, please wait..</ModalBody>
          </ModalContent>
        </Modal>
        <AssignmentFileUploadModal />
        <SendToClientModal />
        <HStack>
          <Button
            onClick={async () => {
              navigate("/expert/portal");
              localStorage.setItem("backButton", true);
              localStorage.setItem("tabIndex", tabIndex);
            }}
          >
            Back to Orders
          </Button>
          <Button
            leftIcon={<RepeatIcon />}
            onClick={async () => {
              _fetchAssignmentDetails();
            }}
          >
            Refresh
          </Button>
        </HStack>
        <Wrap width="100%">
          <Box borderWidth="1px" borderRadius="md" width="100%">
            <Box bgColor="gray.200" p={4}>
              <Heading fontSize={"xl"}>Order Details</Heading>
            </Box>
            <VStack
              alignItems={"start"}
              margin={3}
              minH={"sm"}
              maxH={"sm"}
              overflowY={"scroll"}
            >
              <HStack padding={2}>
                <Text fontWeight={"bold"}>Ordered At:</Text>
                <Text>{assignment.createdAt}</Text>
              </HStack>
              <HStack padding={2}>
                <Text fontWeight={"bold"}>Assignment ID:</Text>
                <Text>{assignment.id}</Text>
              </HStack>
              <HStack padding={2}>
                <Text fontWeight={"bold"}>Subject:</Text>
                <Text>{assignment.subject}</Text>
              </HStack>
              <HStack padding={2}>
                <Text fontWeight={"bold"}>Quotation:</Text>
                <Text>{assignment.quotation}</Text>
              </HStack>
              <HStack padding={2}>
                <Text fontWeight={"bold"}>Paid:</Text>
                <Text>{assignment.paid}</Text>
              </HStack>
              <HStack padding={2}>
                <Text fontWeight={"bold"}>Assigned Expert:</Text>
                <Text>{assignment.assignedExpert}</Text>
              </HStack>
              <HStack padding={2}>
                <Text fontWeight={"bold"}>Assigned Sales:</Text>
                <Text>{assignment.assignedSales}</Text>
              </HStack>
              <HStack padding={2}>
                <Text fontWeight={"bold"}>Assigned QC:</Text>
                <Text>{assignment.assignedQC}</Text>
              </HStack>
              <HStack padding={2}>
                <Text fontWeight={"bold"}>Assigned Operator:</Text>
                <Text>{assignment.assignedOperator}</Text>
              </HStack>
              <VStack padding={2} alignItems={"left"}>
                <Text fontWeight={"bold"}>Description:</Text>
                <Textarea
                  width={"lg"}
                  contentEditable={false}
                  value={assignment.description}
                >
                  {assignment.description}
                </Textarea>
              </VStack>
              <HStack padding={2}>
                <Text fontWeight={"bold"}>Level:</Text>
                <Text>{assignment.level}</Text>
              </HStack>
              <HStack padding={2}>
                <Text fontWeight={"bold"}>Reference:</Text>
                <Text>{assignment.reference}</Text>
              </HStack>
              <HStack padding={2}>
                <Text fontWeight={"bold"}>Pages:</Text>
                <Text>{assignment.numOfPages}</Text>
              </HStack>
              <HStack padding={2}>
                <Text fontWeight={"bold"}>Client Deadline:</Text>
                <Text>{assignment.deadline}</Text>
              </HStack>
              <HStack padding={2}>
                <Text fontWeight={"bold"}>Expert Deadline:</Text>
                <Text>
                  {assignment.expertDeadline
                    ? new Date(
                        assignment.expertDeadline[0]
                      ).toLocaleTimeString() +
                      ", " +
                      new Date(assignment.expertDeadline[0]).toDateString()
                    : ""}
                </Text>
              </HStack>
              <VStack padding={2} alignItems={"left"}>
                {assignment.descriptionFile.length != 0 ? (
                  assignment.descriptionFile.map((file, index) => (
                    <Link
                      href={assignment.descriptionFile[index]}
                      fontWeight={"bold"}
                      color={"blue"}
                      isExternal
                    >
                      {assignment.descriptionFile[index].substring(62)}
                    </Link>
                  ))
                ) : (
                  <></>
                )}
              </VStack>
            </VStack>
          </Box>
          <Box borderWidth="1px" borderRadius="md" width={"xl"}>
            <Box bgColor="gray.200" p={4}>
              <Heading fontSize={"xl"}>Action Window</Heading>
            </Box>
            <VStack
              alignItems={"start"}
              justifyContent={"space-between"}
              margin={3}
              minH={"sm"}
              maxH={"sm"}
            >
              <VStack overflowY={"scroll"} alignItems={"start"} width={"100%"}>
                {actions.length === 0 ? (
                  <></>
                ) : (
                  actions.map((action, index) => (
                    <Box key={action._id}>
                      <VStack alignItems={"start"}>
                        <HStack>
                          {index === 0 ? (
                            <motion.div
                              animate={{ scale: 0.5 }}
                              transition={{
                                repeat: Infinity,
                                repeatType: "reverse",
                                duration: 1,
                              }}
                            >
                              <Circle size={"10px"} bgColor={"tomato"}></Circle>
                            </motion.div>
                          ) : (
                            <Circle size={"10px"} bgColor={"blue.600"}></Circle>
                          )}
                          <Text>{action.at + ": "}</Text>
                          <Text fontWeight={"bold"}>
                            {action.role === "Client" ? "Client" : action.uid}
                          </Text>
                        </HStack>
                        <Text>{action.action}</Text>
                        <Text fontWeight={"bold"}>{"By: " + action.role}</Text>
                      </VStack>
                    </Box>
                  ))
                )}
              </VStack>
            </VStack>
          </Box>
          <Box
            display={
              userRole === "Admin" || userRole === "Super Admin"
                ? "block"
                : "none"
            }
            borderWidth="1px"
            borderRadius="md"
            width={"xl"}
          >
            <Box bgColor="gray.200" p={4}>
              <Heading fontSize={"xl"}>Expert Quotations</Heading>
            </Box>
            <VStack
              alignItems={"start"}
              justifyContent={"space-between"}
              margin={3}
              minH={"sm"}
              maxH={"sm"}
            >
              <VStack overflowY={"scroll"} alignItems={"start"} width={"100%"}>
                {quotations.length === 0 ? (
                  <></>
                ) : (
                  quotations.map((quotation, index) => (
                    <Box key={index}>
                      <VStack alignItems={"start"} marginBottom={"20px"}>
                        <VStack alignItems={"flex-start"}>
                          <Text
                            color={
                              quotation._id === assignment.assignedExpert
                                ? "red"
                                : ""
                            }
                            fontWeight={"bold"}
                          >
                            Expert: {quotation._id}
                          </Text>
                          <Text>Amount: {quotation.cost}</Text>
                        </VStack>
                      </VStack>
                    </Box>
                  ))
                )}
              </VStack>
            </VStack>
          </Box>
          <Box borderWidth="1px" borderRadius="md" width={"xl"}>
            <Box
              display={"flex"}
              alignItems={"center"}
              bgColor="gray.200"
              p={2}
            >
              <Heading fontSize={"xl"}>Assignment Files</Heading>
              <Spacer />
              <Button
                marginRight={"10px"}
                onClick={() => {
                  openSendToClientModal();
                }}
              >
                Send to Client
              </Button>
              <Button
                onClick={() => {
                  openAssignmentFileUploadModal();
                }}
              >
                Upload
              </Button>
            </Box>
            <VStack
              alignItems={"start"}
              justifyContent={"space-between"}
              margin={3}
              minH={"sm"}
              maxH={"sm"}
            >
              <VStack overflowY={"scroll"} alignItems={"start"} width={"100%"}>
                {assignmentFiles.length === 0 ? (
                  <></>
                ) : (
                  assignmentFiles.map((assignmentFile, index) => (
                    <Box key={index}>
                      <VStack alignItems={"start"} marginBottom={"20px"}>
                        <HStack>
                          <Text fontWeight={"bold"}>• Category: </Text>
                          <Text>{assignmentFile.category}</Text>
                        </HStack>
                        <HStack>
                          <Text fontWeight={"bold"}>File Name: </Text>
                          <Link isExternal={true} href={assignmentFile.url}>
                            {assignmentFile.name}
                          </Link>
                        </HStack>
                        <HStack>
                          <Text fontWeight={"bold"}>User: </Text>
                          <Text fontWeight={"bold"}>
                            {assignmentFile.userId}
                          </Text>
                        </HStack>
                      </VStack>
                    </Box>
                  ))
                )}
              </VStack>
            </VStack>
          </Box>
          <Box borderWidth="1px" borderRadius="md" width={"xl"}>
            <Box bgColor="gray.200" p={4}>
              <Heading fontSize={"xl"}>Expert Submissions</Heading>
            </Box>
            <VStack
              alignItems={"start"}
              justifyContent={"space-between"}
              margin={3}
              minH={"sm"}
              maxH={"sm"}
            >
              <VStack overflowY={"scroll"} alignItems={"start"} width={"100%"}>
                {submissions.length === 0 ? (
                  <></>
                ) : (
                  submissions.map((submission, index) => (
                    <Box key={submission._id}>
                      <VStack alignItems={"start"} marginBottom={"20px"}>
                        <HStack>
                          <Text fontWeight={"bold"}>• Category: </Text>
                          <Text>{submission.category}</Text>
                        </HStack>
                        <HStack>
                          <Text fontWeight={"bold"}>File Name: </Text>
                          <Link isExternal={true} href={submission.url}>
                            {submission.name}
                          </Link>
                        </HStack>
                        <HStack>
                          <Text fontWeight={"bold"}>Expert: </Text>
                          <Text fontWeight={"bold"}>{submission.expertId}</Text>
                        </HStack>
                      </VStack>
                    </Box>
                  ))
                )}
              </VStack>
            </VStack>
          </Box>
          <Box borderWidth="1px" borderRadius="md" width={"xl"}>
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
              <VStack overflowY={"scroll"} alignItems={"start"} width={"100%"}>
                {operatorExpertChat.map((messageItem, index) => (
                  <Box
                    display={
                      messageItem.type === "TEXT"
                        ? "flex"
                        : messageItem.type === "MEDIA"
                        ? "flex"
                        : "none"
                    }
                    alignSelf={
                      messageItem.user === id ? "flex-end" : "flex-start"
                    }
                    flexWrap={true}
                    padding={2}
                    borderRadius={"md"}
                    maxWidth="70%"
                    bgColor={messageItem.user === id ? "blue.100" : "green.100"}
                    key={index}
                  >
                    <VStack maxWidth="100%" overflowWrap={"break-word"}>
                      <Text
                        display={messageItem.type === "TEXT" ? "flex" : "none"}
                        maxWidth={"100%"}
                      >
                        {messageItem.msg}
                      </Text>
                      <Link
                        color={"blue"}
                        fontWeight={"bold"}
                        display={messageItem.type === "MEDIA" ? "flex" : "none"}
                        maxWidth={"100%"}
                        href={messageItem.msg}
                      >
                        {messageItem.msg && messageItem.msg.substring(62)}
                      </Link>
                    </VStack>
                  </Box>
                ))}
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
                                assignment.assignedExpert +
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
                      let userToken = localStorage.getItem("expertToken");
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
                              assignment.assignedExpert +
                                "_" +
                                id +
                                "_" +
                                assignment.id
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
                            headers: {
                              Authorization: `Bearer ${userToken}`,
                            },
                          };
                          try {
                            const response = await axios.post(
                              apiUrl + "/messages",
                              {
                                id: assignment.id,
                                expertEmail: assignment.assignedExpert,
                              },
                              config
                            );
                            let resdata = response.data;
                            if (resdata.success) {
                              // window.alert("Message sent to Expert");
                            }
                          } catch (err) {
                            console.log(err);
                          }
                        }
                      }
                      textInput.value = "";
                    }}
                  >
                    <ArrowForwardIcon />
                  </Button>
                </InputRightElement>
              </InputGroup>
            </VStack>
          </Box>
          <Box borderWidth="1px" borderRadius="md" width={"xl"}>
            <Box bgColor="gray.200" p={4}>
              <Heading fontSize={"xl"}>Sticky Notes</Heading>
            </Box>
            <VStack
              alignItems={"start"}
              justifyContent={"space-between"}
              margin={3}
              minH={"sm"}
              maxH={"sm"}
            >
              <VStack overflowY={"scroll"} alignItems={"start"} width={"100%"}>
                {stickyNotes.length === 0 ? (
                  <></>
                ) : (
                  stickyNotes.map((stickyNote, index) => (
                    <Box key={stickyNote.id + stickyNote.comment}>
                      <Text fontWeight={"bold"}>{stickyNote.name + ":"}</Text>
                      <Text
                        display={
                          stickyNote.comment.substring(0, 62) ==
                          "https://assignmentsanta.blob.core.windows.net/assignment-dscp/"
                            ? "none"
                            : "flex"
                        }
                      >
                        {stickyNote.comment}
                      </Text>
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
                        {stickyNote.comment.substring(62)}
                      </Link>
                      {/* <Divider /> */}
                    </Box>
                  ))
                )}
              </VStack>
              <InputGroup
                visibility={
                  userRole === "Operator" ||
                  userRole === "Admin" ||
                  userRole === "Super Admin"
                    ? "visible"
                    : "hidden"
                }
              >
                <Input type="text" id="addSticky" />
                <Input
                  type="file"
                  id="addFileStickyNotes"
                  onChange={async () => {
                    let fileUrl = "";
                    if (inputFileStickyNotes) {
                      try {
                        var config = {
                          method: "put",
                          url:
                            "https://assignmentsanta.blob.core.windows.net/assignment-dscp/" +
                            encodeURIComponent(
                              inputFileStickyNotes.current.files[0].name
                            ) +
                            "?" +
                            token,
                          headers: {
                            "x-ms-blob-type": "BlockBlob",
                          },
                          data: inputFileStickyNotes.current.files[0],
                        };

                        axios(config)
                          .then(async function (response) {
                            fileUrl =
                              "https://assignmentsanta.blob.core.windows.net/assignment-dscp/" +
                              encodeURIComponent(
                                inputFileStickyNotes.current.files[0].name
                              );
                            let userToken = localStorage.getItem("expertToken");
                            let userEmail = localStorage.getItem("userEmail");
                            let userName = localStorage.getItem("userName");

                            let config = {
                              headers: {
                                Authorization: `Bearer ${userToken}`,
                              },
                            };
                            if (fileUrl === "") {
                              window.alert("Attachment cannot be empty");
                            } else {
                              const response = await axios.post(
                                apiUrl +
                                  "/assignment/comments/operatorToExpert",
                                {
                                  assignmentId: params.assignmentID,
                                  expertId: assignment.assignedExpert,
                                  notesFromOperator: {
                                    _id: userEmail,
                                    name: userName,
                                    comment: fileUrl,
                                  },
                                },
                                config
                              );
                              if (response.data.success) {
                                await _fetchAssignmentStickyNotes();
                              } else {
                                console.log(response);
                              }
                            }
                          })
                          .catch(function (error) {
                            console.log(error);
                          });
                      } catch (error) {
                        console.log(error);
                      }
                    }
                  }}
                  ref={inputFileStickyNotes}
                  style={{ display: "none" }}
                />
                <InputLeftElement h={"full"}>
                  <Button
                    id="attachButton"
                    onClick={async () => {
                      inputFileStickyNotes.current.click();
                    }}
                  >
                    <AttachmentIcon />
                  </Button>
                </InputLeftElement>
                <InputRightElement h={"full"}>
                  <Button
                    variant={"outline"}
                    onClick={() => {
                      _addAssignmentStickyNote();
                    }}
                  >
                    <ArrowForwardIcon />
                  </Button>
                </InputRightElement>
              </InputGroup>
            </VStack>
          </Box>
          <HStack display={userRole === "QC" ? "block" : "none"}>
            <Box borderWidth="1px" borderRadius="md" width={"xl"}>
              <Box bgColor="gray.200" p={4}>
                <Heading fontSize={"xl"}>QC Notes</Heading>
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
                  {qcNotes.length === 0 ? (
                    <></>
                  ) : (
                    qcNotes.map((qcNote, index) => (
                      <Box key={qcNote.id + qcNote.comment}>
                        <Text fontWeight={"bold"}>{qcNote.name + ":"}</Text>
                        <Text
                          display={
                            qcNote.comment.substring(0, 62) ==
                            "https://assignmentsanta.blob.core.windows.net/assignment-dscp/"
                              ? "none"
                              : "flex"
                          }
                        >
                          {qcNote.comment}
                        </Text>
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
                          {qcNote.comment.substring(62)}
                        </Link>
                        {/* <Divider /> */}
                      </Box>
                    ))
                  )}
                </VStack>
                <InputGroup
                  visibility={userRole === "QC" ? "visible" : "hidden"}
                >
                  <Input type="text" id="addQc" />
                  <Input
                    type="file"
                    id="addFileQCNotes"
                    onChange={async () => {
                      let fileUrl = "";
                      if (inputFileQCNotes) {
                        try {
                          var config = {
                            method: "put",
                            url:
                              "https://assignmentsanta.blob.core.windows.net/assignment-dscp/" +
                              encodeURIComponent(
                                inputFileQCNotes.current.files[0].name
                              ) +
                              "?" +
                              token,
                            headers: {
                              "x-ms-blob-type": "BlockBlob",
                            },
                            data: inputFileQCNotes.current.files[0],
                          };

                          axios(config)
                            .then(async function (response) {
                              fileUrl =
                                "https://assignmentsanta.blob.core.windows.net/assignment-dscp/" +
                                encodeURIComponent(
                                  inputFileQCNotes.current.files[0].name
                                );
                              let userToken =
                                localStorage.getItem("expertToken");
                              let userEmail = localStorage.getItem("userEmail");
                              let userName = localStorage.getItem("userName");

                              let config = {
                                headers: {
                                  Authorization: `Bearer ${userToken}`,
                                },
                              };
                              if (fileUrl === "") {
                                window.alert("Attachment cannot be empty");
                              } else {
                                const response = await axios.post(
                                  apiUrl + "/assignment/comments/QCToExpert",
                                  {
                                    assignmentId: params.assignmentID,
                                    expertId: assignment.assignedExpert,
                                    commentsFromQC: {
                                      _id: userEmail,
                                      name: userName,
                                      comment: fileUrl,
                                    },
                                  },
                                  config
                                );
                                if (response.data.success) {
                                  await _fetchAssignmentQcNotes();
                                } else {
                                  console.log(response);
                                }
                              }
                            })
                            .catch(function (error) {
                              console.log(error);
                            });
                        } catch (error) {
                          console.log(error);
                        }
                      }
                    }}
                    ref={inputFileQCNotes}
                    style={{ display: "none" }}
                  />
                  <InputLeftElement h={"full"}>
                    <Button
                      id="attachButton"
                      onClick={async () => {
                        inputFileQCNotes.current.click();
                      }}
                    >
                      <AttachmentIcon />
                    </Button>
                  </InputLeftElement>
                  <InputRightElement h={"full"}>
                    <Button
                      variant={"outline"}
                      onClick={() => {
                        _addAssignmentQcNote();
                      }}
                    >
                      <ArrowForwardIcon />
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </VStack>
            </Box>
          </HStack>
          <Box
            display={
              userRole === "QC" &&
              id === assignment.assignedQC &&
              assignment.assignedExpert !== undefined
                ? "block"
                : "none"
            }
            borderWidth="1px"
            borderRadius="md"
            width={"xl"}
          >
            <Box p={4} bgColor="gray.200">
              <HStack>
                <Heading fontSize={"xl"}>QC Chat with Expert</Heading>
              </HStack>
            </Box>
            <VStack
              alignItems={"start"}
              justifyContent={"space-between"}
              margin={3}
              minH={"sm"}
              maxH={"sm"}
            >
              <VStack overflowY={"scroll"} alignItems={"start"} width={"100%"}>
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
                      messageItem.user === id ? "flex-end" : "flex-start"
                    }
                    flexWrap={true}
                    padding={2}
                    borderRadius={"md"}
                    maxWidth="70%"
                    bgColor={messageItem.user === id ? "blue.100" : "green.100"}
                    key={index}
                  >
                    <VStack maxWidth="100%" overflowWrap={"break-word"}>
                      <Text
                        display={messageItem.type === "TEXT" ? "flex" : "none"}
                        maxWidth={"100%"}
                      >
                        {messageItem.msg}
                      </Text>
                      <Link
                        color={"blue"}
                        fontWeight={"bold"}
                        display={messageItem.type === "MEDIA" ? "flex" : "none"}
                        maxWidth={"100%"}
                        href={messageItem.msg}
                      >
                        {messageItem.msg && messageItem.msg.substring(62)}
                      </Link>
                    </VStack>
                  </Box>
                ))}
              </VStack>
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
                  ref={inputFileQCExpert}
                  style={{ display: "none" }}
                />
                <InputLeftElement h={"full"}>
                  <Button
                    id="attachButton"
                    onClick={async () => {
                      inputFileQCExpert.current.click();
                    }}
                  >
                    <AttachmentIcon />
                  </Button>
                </InputLeftElement>
                <InputRightElement h={"full"}>
                  <Button
                    id="sendButton"
                    onClick={async () => {
                      let Regex =
                        /\b[\+]?[(]?[0-9]{2,6}[)]?[-\s\.]?[-\s\/\.0-9]{3,15}\b/m;
                      let textInput =
                        document.getElementById("addChatQCExpert");
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
                              assignment.assignedExpert +
                                "_" +
                                id +
                                "_" +
                                assignment.id
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
                        }
                      }
                      textInput.value = "";
                    }}
                  >
                    <ArrowForwardIcon />
                  </Button>
                </InputRightElement>
              </InputGroup>
            </VStack>
          </Box>
          <Box
            display={userRole === "Sales" ? "block" : "none"}
            borderWidth="1px"
            borderRadius="md"
            width={"xl"}
          >
            <Box p={4} bgColor="gray.200">
              <HStack>
                <Heading fontSize={"xl"}>Sales Chat with Client</Heading>
                <Spacer />
                <Text
                  visibility={
                    userRole === "Sales" && assignment.assignedSales !== id
                      ? "visible"
                      : "hidden"
                  }
                  color={"red"}
                  onClick={async () => {
                    let userToken = localStorage.getItem("expertToken");
                    let config = {
                      headers: { Authorization: `Bearer ${userToken}` },
                    };
                    const response = await axios.post(
                      apiUrl + "/assignment/update",
                      {
                        _id: assignment.id,
                        assignedSales: id,
                      },
                      config
                    );
                    await _fetchAssignmentDetails();
                    window.alert(
                      "Override Complete. You are now Assigned to this Assignment"
                    );
                  }}
                >
                  Override
                </Text>
              </HStack>
            </Box>
            <VStack
              alignItems={"start"}
              justifyContent={"space-between"}
              margin={3}
              minH={"sm"}
              maxH={"sm"}
            >
              <VStack overflowY={"scroll"} alignItems={"start"} width={"100%"}>
                {salesChat.map((messageItem, index) => (
                  <Box
                    display={
                      messageItem.type === "TEXT"
                        ? "flex"
                        : messageItem.type === "MEDIA"
                        ? "flex"
                        : "none"
                    }
                    alignSelf={
                      messageItem.user === id ? "flex-end" : "flex-start"
                    }
                    flexWrap={true}
                    padding={2}
                    borderRadius={"md"}
                    maxWidth="70%"
                    bgColor={messageItem.user === id ? "blue.100" : "green.100"}
                    key={index}
                  >
                    <VStack maxWidth="100%" overflowWrap={"break-word"}>
                      <Text
                        display={messageItem.type === "TEXT" ? "flex" : "none"}
                        maxWidth={"100%"}
                      >
                        {messageItem.msg}
                      </Text>
                      <Link
                        color={"blue"}
                        fontWeight={"bold"}
                        display={messageItem.type === "MEDIA" ? "flex" : "none"}
                        maxWidth={"100%"}
                        href={messageItem.msg}
                      >
                        {messageItem.msg.substring(62)}
                      </Link>
                    </VStack>
                  </Box>
                ))}
              </VStack>
              <InputGroup>
                <Input type="text" id="addChatSales" />
                <Input
                  type="file"
                  id="addFileSalesClient"
                  onChange={async () => {
                    let fileUrl = "";
                    if (inputFileSalesClient) {
                      try {
                        var config = {
                          method: "put",
                          url:
                            "https://assignmentsanta.blob.core.windows.net/assignment-dscp/" +
                            encodeURIComponent(
                              inputFileSalesClient.current.files[0].name
                            ) +
                            "?" +
                            token,
                          headers: {
                            "x-ms-blob-type": "BlockBlob",
                          },
                          data: inputFileSalesClient.current.files[0],
                        };
                        axios(config)
                          .then(async function (response) {
                            fileUrl =
                              "https://assignmentsanta.blob.core.windows.net/assignment-dscp/" +
                              encodeURIComponent(
                                inputFileSalesClient.current.files[0].name
                              );
                            const message = await updateDoc(
                              doc(
                                db,
                                "chat",
                                clientId + "_" + id + "_" + assignment.id
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
                    }
                  }}
                  ref={inputFileSalesClient}
                  style={{ display: "none" }}
                />
                <InputLeftElement h={"full"}>
                  <Button
                    id="attachButton"
                    onClick={async () => {
                      inputFileSalesClient.current.click();
                    }}
                  >
                    <AttachmentIcon />
                  </Button>
                </InputLeftElement>
                <InputRightElement h={"full"}>
                  <Button
                    id="sendButton"
                    onClick={async () => {
                      if (assignment.assignedSales !== id) {
                        window.alert(
                          "You are not assigned to this Assignment!!! You will have to override first to continue"
                        );
                      } else {
                        let Regex =
                          /\b[\+]?[(]?[0-9]{2,6}[)]?[-\s\.]?[-\s\/\.0-9]{3,15}\b/m;
                        let textInput = document.getElementById("addChatSales");
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
                                clientId + "_" + id + "_" + assignment.id
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
                          }
                        }
                        textInput.value = "";
                      }
                    }}
                  >
                    <ArrowForwardIcon />
                  </Button>
                </InputRightElement>
              </InputGroup>
            </VStack>
          </Box>
          <Box
            display={
              userRole === "Admin" || userRole === "Super Admin"
                ? "block"
                : "none"
            }
            borderWidth="1px"
            borderRadius="md"
            width={"xl"}
          >
            <Box p={4} bgColor="gray.200">
              <HStack>
                <Heading fontSize={"xl"}>
                  Sales Chat with Client (Admin View)
                </Heading>
                <Spacer />
              </HStack>
            </Box>
            <VStack
              alignItems={"start"}
              justifyContent={"space-between"}
              margin={3}
              minH={"sm"}
              maxH={"sm"}
            >
              <VStack overflowY={"scroll"} alignItems={"start"} width={"100%"}>
                {salesViewChat.map((messageItem, index) => (
                  <>
                    <Text fontWeight={"bold"} maxWidth={"100%"}>
                      {messageItem.user}:
                    </Text>
                    <Box
                      display={
                        messageItem.type === "TEXT"
                          ? "flex"
                          : messageItem.type === "MEDIA"
                          ? "flex"
                          : "none"
                      }
                      flexWrap={true}
                      padding={2}
                      borderRadius={"md"}
                      maxWidth="70%"
                      bgColor={"green.100"}
                      key={index}
                    >
                      <VStack maxWidth="100%" overflowWrap={"break-word"}>
                        <VStack>
                          <Text
                            display={
                              messageItem.type === "TEXT" ? "flex" : "none"
                            }
                            maxWidth={"100%"}
                          >
                            {messageItem.msg}
                          </Text>
                          <Link
                            color={"blue"}
                            fontWeight={"bold"}
                            display={
                              messageItem.type === "MEDIA" ? "flex" : "none"
                            }
                            maxWidth={"100%"}
                            href={messageItem.msg}
                          >
                            {messageItem.msg.substring(62)}
                          </Link>
                        </VStack>
                      </VStack>
                    </Box>
                  </>
                ))}
              </VStack>
            </VStack>
          </Box>
          <Box
            display={
              userRole === "Admin" || userRole === "Super Admin"
                ? "block"
                : "none"
            }
            borderWidth="1px"
            borderRadius="md"
            width={"xl"}
          >
            <Box p={4} bgColor="gray.200">
              <HStack>
                <Heading fontSize={"xl"}>
                  Operator Chat with Expert (Admin View)
                </Heading>
                <Spacer />
              </HStack>
            </Box>
            <VStack
              alignItems={"start"}
              justifyContent={"space-between"}
              margin={3}
              minH={"sm"}
              maxH={"sm"}
            >
              <VStack overflowY={"scroll"} alignItems={"start"} width={"100%"}>
                {operatorExpertViewChat.map((messageItem, index) => (
                  <>
                    <Text fontWeight={"bold"} maxWidth={"100%"}>
                      {messageItem.user}:
                    </Text>
                    <Box
                      display={
                        messageItem.type === "TEXT"
                          ? "flex"
                          : messageItem.type === "MEDIA"
                          ? "flex"
                          : "none"
                      }
                      flexWrap={true}
                      padding={2}
                      borderRadius={"md"}
                      maxWidth="70%"
                      bgColor={"green.100"}
                      key={index}
                    >
                      <VStack maxWidth="100%" overflowWrap={"break-word"}>
                        <VStack>
                          <Text
                            display={
                              messageItem.type === "TEXT" ? "flex" : "none"
                            }
                            maxWidth={"100%"}
                          >
                            {messageItem.msg}
                          </Text>
                          <Link
                            color={"blue"}
                            fontWeight={"bold"}
                            display={
                              messageItem.type === "MEDIA" ? "flex" : "none"
                            }
                            maxWidth={"100%"}
                            href={messageItem.msg}
                          >
                            {messageItem.msg.substring(62)}
                          </Link>
                        </VStack>
                      </VStack>
                    </Box>
                  </>
                ))}
              </VStack>
            </VStack>
          </Box>
          <Box
            display={
              userRole === "Admin" || userRole === "Super Admin"
                ? "block"
                : "none"
            }
            borderWidth="1px"
            borderRadius="md"
            width={"xl"}
          >
            <Box p={4} bgColor="gray.200">
              <HStack>
                <Heading fontSize={"xl"}>
                  QC Chat with Expert (Admin View)
                </Heading>
                <Spacer />
              </HStack>
            </Box>
            <VStack
              alignItems={"start"}
              justifyContent={"space-between"}
              margin={3}
              minH={"sm"}
              maxH={"sm"}
            >
              <VStack overflowY={"scroll"} alignItems={"start"} width={"100%"}>
                {qcExpertViewChat.map((messageItem, index) => (
                  <>
                    <Text fontWeight={"bold"} maxWidth={"100%"}>
                      {messageItem.user}:
                    </Text>
                    <Box
                      display={
                        messageItem.type === "TEXT"
                          ? "flex"
                          : messageItem.type === "MEDIA"
                          ? "flex"
                          : "none"
                      }
                      flexWrap={true}
                      padding={2}
                      borderRadius={"md"}
                      maxWidth="70%"
                      bgColor={"green.100"}
                      key={index}
                    >
                      <VStack maxWidth="100%" overflowWrap={"break-word"}>
                        <VStack>
                          <Text
                            display={
                              messageItem.type === "TEXT" ? "flex" : "none"
                            }
                            maxWidth={"100%"}
                          >
                            {messageItem.msg}
                          </Text>
                          <Link
                            color={"blue"}
                            fontWeight={"bold"}
                            display={
                              messageItem.type === "MEDIA" ? "flex" : "none"
                            }
                            maxWidth={"100%"}
                            href={messageItem.msg}
                          >
                            {messageItem.msg.substring(62)}
                          </Link>
                        </VStack>
                      </VStack>
                    </Box>
                  </>
                ))}
              </VStack>
            </VStack>
          </Box>
        </Wrap>
      </VStack>
    </>
  );
}

export default AssignmentDetails;

export async function getStaticPaths() {
  let config = {
    headers: {
      Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.TWFuc2lnaGFuZ2FzOTk3QGdtYWlsLmNvbQ.KPWBp-VvwR49fneCGQdFCpWSpDDGSERHOfq7wCbgEyU`,
    },
  };
  const response = await axios.get(apiUrl + "/assignment/fetch", config);
  let data = await response.data.assignmentData;
  const paths = data.map((data) => ({
    params: { assignmentID: data._id },
  }));
  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const { assignmentID } = params;

  let config = {
    headers: {
      Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.TWFuc2lnaGFuZ2FzOTk3QGdtYWlsLmNvbQ.KPWBp-VvwR49fneCGQdFCpWSpDDGSERHOfq7wCbgEyU`,
    },
  };
  const response = await axios.get(
    apiUrl + "/assignment/fetch?_id=" + assignmentID,
    config
  );
  let data = await response.data.assignmentData;

  return {
    props: {
      data,
    },
  };
}
