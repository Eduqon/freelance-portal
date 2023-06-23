import Calendar from "react-calendar";
import {
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Link,
} from "@chakra-ui/react";
import { Box } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../services/contants";
import axios from "axios";

function ExpertDeadlineCalendarView() {
  const [assignments, setAssignments] = useState([]);

  let navigate = useNavigate();

  let assignmentList = [];

  useEffect(() => {
    _fetchAssignments(new Date());
  }, []);

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
      let data = response.data.assignmentData;

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
              client_id: data.client_id,
              assignedExpert: data.assignedExpert,
              expert: data.assignedExpert,
              subject: data.subject,
              status: data.status,
              quotation: data.quotation,
              currencyOfQuote: data.currencyOfQuote,
              level: data.level,
              reference: data.reference,
              description: data.description,
              descriptionFile: data.descriptionFile,
              page_word_data: data.page_word_data,
              display_page_word: data.display_page_word,
              charges: data.charges,
              paid: data.paid,
              deadline:
                new Date(data.deadline).toLocaleTimeString() +
                ", " +
                new Date(data.deadline).toDateString(),
              expertDeadline: data.expertDeadline ? data.expertDeadline : [],
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
              <Th>Deadline</Th>
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
                  <Td>{assignment.deadline}</Td>
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
      {/* <div display={{ base: "block", sm: "none", md: "none" }}>
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
                              <Th>Student Email</Th>
                              <Td>
                                {localStorage.getItem("userRole") ===
                                "Super Admin"
                                  ? assignment.client_id
                                  : assignment.client_id.substring(0, 2) +
                                    "****" +
                                    "@" +
                                    "****" +
                                    ".com"}
                              </Td>
                            </Tr>
                            <Tr>
                              <Th>Subject</Th>
                              <Td color={"green.600"} fontWeight={"semibold"}>
                                {assignment.subject}
                              </Td>
                            </Tr>
                            <Tr>
                              <Th>Amount Paid</Th>
                              <Td>{assignment.paid}</Td>
                            </Tr>
                            <Tr>
                              <Th>Expert</Th>
                              <Td>{assignment.assignedExpert}</Td>
                            </Tr>
                            <Tr>
                              <Th>Expert Deadline</Th>
                              <Td fontWeight={"semibold"}>
                                {assignment.expertDeadline}
                              </Td>
                            </Tr>
                            <Tr>
                              <Th>Deadline</Th>
                              <Td color={"red.600"} fontWeight={"semibold"}>
                                {assignment.deadline}
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
      </div> */}
    </>
  );
}

export default ExpertDeadlineCalendarView;
