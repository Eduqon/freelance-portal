import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Link,
  Button,
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../services/contants";
import axios from "axios";

function ExpertDeadlineListView() {
  const [assignments, setAssignments] = useState([]);
  const [expertEmail, setExpertEmail] = useState("");

  let navigate = useNavigate();

  let assignmentList = [];

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) {
      setExpertEmail(email);
    }
    _fetchAssignments();
  }, [expertEmail]);

  async function _fetchAssignments() {
    try {
      let userToken = localStorage.getItem("expertToken");
      if (userToken == null) {
        navigate("/expert/login");
      }

      let config = {
        headers: { Authorization: `Bearer ${userToken}` },
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
      let data = response.data.assignmentData.filter(
        (value) => value.assignedExpert === expertEmail
      );
      assignmentList = [];
      if (data.length !== 0) {
        for (let index = 0; index < data.length; index++) {
          assignmentList.push({
            id: data[index]._id,
            subject: data[index].subject,
            status: data[index].status,
            page_word_data: data[index].page_word_data,
            display_page_word: data[index].display_page_word,
            charges: data[index].charges,
            expertDeadline: data[index].expertDeadline
              ? new Date(
                  data[index].expertDeadline[data[index]._id]
                ).toLocaleTimeString() +
                ", " +
                new Date(
                  data[index].expertDeadline[data[index]._id]
                ).toDateString()
              : "",
          });
        }
      } else {
        console.log("No Orders");
      }
      setAssignments(assignmentList);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <>
      <div display={{ base: "none", sm: "block", md: "block" }}>
        <Table
          variant="simple"
          size="md"
          display={{ base: "none", sm: "block", md: "block" }}
        >
          <Thead bgColor={"gray.200"}>
            <Tr>
              <Th>Id</Th>
              <Th>Subject</Th>
              <Th>Expert Deadline</Th>
              <Th>Word Limit / Pages</Th>
              <Th>Payment Confirmed</Th>
              <Th>Status</Th>
              <Th alignContent={"flex-end"}>
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
          {assignments && assignments.length !== 0 ? (
            <Tbody>
              {assignments.map((assignment) => (
                <Tr key={assignment.id}>
                  <Td fontWeight={"semibold"}>
                    <Link href={"/assignment_details/" + assignment.id}>
                      {assignment.id}
                    </Link>
                  </Td>
                  <Td color={"green.600"} fontWeight={"semibold"}>
                    {assignment.subject}
                  </Td>
                  <Td>{assignment.expertDeadline}</Td>
                  <Td>
                    {assignment.page_word_data +
                      " " +
                      assignment.display_page_word}
                  </Td>
                  <Td fontWeight={"semibold"}>{assignment.charges}</Td>
                  <Td color={"red.600"} fontWeight={"semibold"}>
                    {assignment.status}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          ) : (
            <Tbody display="flex">
              <Box margin="0 auto">No Orders</Box>
            </Tbody>
          )}
        </Table>
      </div>
      {/* accordion for mobile version  */}
      <div display={{ base: "block", sm: "none", md: "none" }}>
        {assignments.map((assignment) => {
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
                <TableContainer>
                  <Table>
                    <Tbody>
                      <>
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
                              <Td>{assignment.deadline}</Td>
                            </Tr>
                            <Tr>
                              <Th>Word Limit / Pages</Th>
                              <Td>
                                {assignment.page_word_data +
                                  " " +
                                  assignment.display_page_word}
                              </Td>
                            </Tr>
                            <Tr>
                              <Th>Payment Confirmed</Th>
                              <Td fontWeight={"semibold"}>
                                {assignment.charges}
                              </Td>
                            </Tr>
                          </Table>
                        </Tr>
                      </>
                    </Tbody>
                  </Table>
                </TableContainer>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>;
        })}
      </div>
    </>
  );
}

export default ExpertDeadlineListView;
