import { RepeatIcon, AttachmentIcon } from "@chakra-ui/icons";
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
} from "@chakra-ui/react";
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { apiUrl } from "../../services/contants";
import { useNavigate } from "react-router-dom";

function InternalReworkOrders({ incrementCounter, decrementCounter }) {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState();

  const [token, setToken] = useState("");
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isUploading, setIsUploading] = useState(false);

  let assignmentList = [];
  let submissionsList = [];

  let navigate = useNavigate();

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
          assignedQC: userEmail,
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
      decrementCounter("Internal Rework");
      _fetchAssignments();
    } catch (error) {
      //console.log(error);
    }
  }

  async function sendForRework(index) {
    let qcComments = document.getElementById("qcComment");
    let userEmail = localStorage.getItem("userEmail");
    let userName = localStorage.getItem("userName");
    if (qcComments.value === "") {
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
            },
            config
          );

          const createNotification = await axios.post(
            apiUrl + "/notifications",
            {
              assignmentId: assignments[selectedIndex].id,
              status: "Internal Rework",
              read: false,
            },
            config
          );
          incrementCounter("Internal Rework");
          //decrementCounter("Internal Rework");
          const responseQcNote = await axios.post(
            apiUrl + "/assignment/comments/QCToExpert",
            {
              assignmentId: assignments[index].id,
              expertId: assignments[index].assignedExpert,
              commentsFromQC: {
                _id: userEmail,
                name: userName,
                comment: qcComments.value,
              },
            },
            config
          );
          _fetchAssignments();
          ReworkModalDis.onClose();
        } catch (error) {
          //console.log(error);
        }
      } else {
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
            },
            config
          );

          const createNotification = await axios.post(
            apiUrl + "/notifications",
            {
              assignmentId: assignments[selectedIndex].id,
              status: "Internal Rework",
              read: false,
            },
            config
          );
          incrementCounter("Internal Rework");
          const responseQcNoteFile = await axios.post(
            apiUrl + "/assignment/comments/QCToExpert",
            {
              assignmentId: assignments[index].id,
              expertId: assignments[index].assignedExpert,
              commentsFromQC: {
                _id: userEmail,
                name: userName,
                comment: fileUrl,
              },
            },
            config
          );
          const responseQcNote = await axios.post(
            apiUrl + "/assignment/comments/QCToExpert",
            {
              assignmentId: assignments[index].id,
              expertId: assignments[index].assignedExpert,
              commentsFromQC: {
                _id: userEmail,
                name: userName,
                comment: qcComments.value,
              },
            },
            config
          );
          _fetchAssignments();
          ReworkModalDis.onClose();
        } catch (error) {
          //console.log(error);
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
              <Textarea id="qcComment"></Textarea>
            </InputGroup>
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={() => {
                if (isUploading) {
                  window.alert("File is still being uploaded");
                } else {
                  sendForRework(selectedIndex);
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
        navigate("/qclogin");
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
            createdAt: data[index].createdAt,
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
        size={"2xl"}
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
                              assignments[selectedIndex].expertDeadlineNF
                            ) <=
                          0
                            ? "green"
                            : "red"
                        }
                      >
                        {new Date(submission.createdAtNF) -
                          new Date(
                            assignments[selectedIndex].expertDeadlineNF
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

  useEffect(() => {
    _fetchAssignments();
  }, []);

  async function _fetchAssignments() {
    try {
      let userToken = localStorage.getItem("userToken");
      if (userToken == null) {
        navigate("/qclogin");
      }

      let config = {
        headers: { Authorization: `Bearer ${userToken}` },
      };
      const response = await axios.get(
        apiUrl + "/assignment/fetch?status=Internal%20Rework",
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
            numOfPages: data[index].numOfPages,
            paid: data[index].paid,
            deadline:
              new Date(data[index].deadline).toLocaleTimeString() +
              ", " +
              new Date(data[index].deadline).toDateString(),
            expertDeadline:
              new Date(data[index].expertDeadline).toLocaleTimeString() +
              ", " +
              new Date(data[index].expertDeadline).toDateString(),
            expertDeadlineNF: data[index].expertDeadline,
          });
        }
        await _fetchToken();
      } else {
        console.log("No Raw Submission Orders");
      }
      setAssignments(assignmentList);
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
        <ReworkModal />
        <SubmissionsModal />
        <Table
          variant="simple"
          size="md"
          display={{ base: "none", sm: "block", md: "block" }}
        >
          <Thead bgColor={"gray.200"}>
            <Tr>
              <Th>Id</Th>
              <Th>Subject</Th>
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
            {assignments.map((assignment, index) => (
              <Tr key={assignment.id}>
                <Td fontWeight={"semibold"}>
                  <Link href={"/admin/assignment_details/" + assignment.id}>
                    {assignment.id}
                  </Link>
                </Td>
                <Td color={"green.600"} fontWeight={"semibold"}>
                  {assignment.subject}
                </Td>
                <Td color={"red.600"} fontWeight={"semibold"}>
                  {assignment.deadline}
                </Td>
                <Td color={"red.600"} fontWeight={"semibold"}>
                  {assignment.expertDeadline}
                </Td>
                <Td>{assignment.assignedExpert}</Td>
                <Td>{assignment.assignedQC}</Td>
                <Td>
                  <HStack>
                    <Button onClick={async () => openSubmissionsModal(index)}>
                      Submissions from Experts
                    </Button>
                    <Button onClick={async () => markAsProofRead(index)}>
                      Mark as Proof Read
                    </Button>
                    <Button
                      color={"red"}
                      onClick={async () => openReworkModal(index)}
                    >
                      Send for Rework
                    </Button>
                    <Button
                      color={"red"}
                      onClick={async () => removeExpert(index)}
                    >
                      Remove Expert
                    </Button>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
      {/* accordion for mobile  */}
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
                    internal Rework Orders
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
                <ReworkModal />
                <SubmissionsModal />
                <Table variant="simple" size="md">
                  <Tbody>
                    <Tr key={assignment.id}>
                      <Table bgColor={"gray.200"}>
                        <Tr>
                          <Td fontWeight={"semibold"}>
                            <Link
                              href={
                                "/admin/assignment_details/" + assignment.id
                              }
                            >
                              {assignment.id}
                            </Link>
                          </Td>
                        </Tr>
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
                            {assignment.expertDeadline}
                          </Td>
                        </Tr>
                        <Tr>
                          <Th>Assigned Expert</Th>
                          <Td>{assignment.assignedExpert}</Td>
                        </Tr>
                        <Tr>
                          <Th>Assigned QC</Th>
                          <Td>{assignment.assignedQC}</Td>
                        </Tr>
                        <Tr>
                          <Td>
                            <HStack>
                              <Button
                                onClick={async () =>
                                  openSubmissionsModal(index)
                                }
                              >
                                Submissions from Experts
                              </Button>
                              <Button
                                onClick={async () => markAsProofRead(index)}
                              >
                                Mark as Proof Read
                              </Button>
                              <Button
                                color={"red"}
                                onClick={async () => openReworkModal(index)}
                              >
                                Send for Rework
                              </Button>
                              <Button
                                color={"red"}
                                onClick={async () => removeExpert(index)}
                              >
                                Remove Expert
                              </Button>
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

export default InternalReworkOrders;
