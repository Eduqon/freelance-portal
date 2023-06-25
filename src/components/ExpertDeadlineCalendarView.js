import Calendar from "react-calendar";
import {
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Link,
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../services/contants";
import axios from "axios";

function ExpertDeadlineCalendarView() {
  const [assignments, setAssignments] = useState([]);
  const [expertEmail, setExpertEmail] = useState("");

  let navigate = useNavigate();

  let assignmentList = [];

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) {
      setExpertEmail(email);
    }
    _fetchAssignments(new Date());
  }, [expertEmail]);

  async function _fetchAssignments(dateValue) {
    try {
      let userToken = localStorage.getItem("expertToken");
      if (userToken == null) {
        navigate("/expert/login");
      }

      let config = {
        headers: { Authorization: `Bearer ${userToken}` },
      };

      const response = await axios.get(apiUrl + "/assignment/fetch", config);
      let data = response.data.assignmentData.filter(
        (value) => value.assignedExpert === expertEmail
      );

      const expertID = data.filter(
        (data) =>
          typeof data.expertDeadline === "object" &&
          data.assignedExpert &&
          new Date(
            data.expertDeadline[data._id][
              data.expertDeadline[data._id].length - 1
            ]
          ).toDateString() === dateValue.toDateString()
      );
      assignmentList = [];
      expertID && expertID.length !== 0
        ? expertID.forEach((data) => {
            assignmentList.push({
              id: data._id,
              subject: data.subject,
              status: data.status,
              page_word_data: data.page_word_data,
              display_page_word: data.display_page_word,
              charges: data.charges,
              expertDeadline: data.expertDeadline
                ? new Date(data.expertDeadline[data._id]).toLocaleTimeString() +
                  ", " +
                  new Date(data.expertDeadline[data._id]).toDateString()
                : "",
            });
          })
        : console.log("No Orders");

      setAssignments(assignmentList);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <>
      <div display={{ base: "none", sm: "block", md: "block" }}>
        <HStack marginBottom={"20px"}>
          <Calendar
            onClickDay={(value) => {
              _fetchAssignments(value);
            }}
          />
        </HStack>
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
            </Tr>
          </Thead>
          {assignments && assignments.length !== 0 ? (
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
                              <Th>Expert Deadline</Th>
                              <Td>{assignment.expertDeadline}</Td>
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
                            <Tr>
                              <Th>Status</Th>
                              <Td color={"red.600"} fontWeight={"semibold"}>
                                {assignment.status}
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

export default ExpertDeadlineCalendarView;
