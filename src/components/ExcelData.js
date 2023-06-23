import {
  Box,
  Button,
  Center,
  Checkbox,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Link,
  Select,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useState } from "react";
import { CSVLink } from "react-csv";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../services/contants";

function GetExcelData() {
  const [error, setError] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [showData, setShowData] = useState(false);
  const [allData, setAllData] = useState(false);
  const [date, setDate] = useState({
    startDate: "",
    endDate: "",
  });
  let assignmentList = [];
  let allAssignmentList = [];
  let selectedExpert = localStorage.getItem("userEmail");
  let navigate = useNavigate();

  async function _fetchAssignments() {
    try {
      let userToken = localStorage.getItem("expertToken");
      if (userToken == null) {
        navigate("/expert/login");
      }

      let config = {
        headers: { Authorization: `Bearer ${userToken}` },
      };
      const response = await axios.get(apiUrl + "/assignment/fetch", config);
      let newData = response.data.assignmentData.filter(
        (data) => data.assignedExpert === selectedExpert
      );
      let filterData =
        newData &&
        newData.filter(
          (data) =>
            new Date(data.expertAssignedDate).toLocaleDateString() >=
              new Date(date.startDate).toLocaleDateString() &&
            new Date(data.expertAssignedDate).toLocaleDateString() <=
              new Date(date.endDate).toLocaleDateString()
        );
      assignmentList = [];
      filterData.length !== 0
        ? filterData.forEach((data, index) => {
            assignmentList.push({
              _id: data._id,
              subject: data.subject,
              instructionFile: data.descriptionFile[0],
              assignDate:
                new Date(data.expertAssignedDate).toLocaleTimeString() +
                ", " +
                new Date(data.expertAssignedDate).toDateString(),
              expertDeadline:
                new Date(data.deadline).toLocaleTimeString() +
                ", " +
                new Date(data.deadline).toDateString(),
              deliveryDate:
                new Date(data.deliveryDate).toLocaleTimeString() +
                ", " +
                new Date(data.deliveryDate).toDateString(),
              pages_or_wordCount:
                (data.page_word_data || "") +
                " " +
                (data.display_page_word || ""),
              charges:
                data.charges === "Regular Charges"
                  ? "Regular Charges"
                  : "Special Charges",
              amount_Charges_Confirmed: data.charges || "",
              refund: "",
              payment_Status: "",
            });
          })
        : console.log("No Assignments");

      setAssignments(assignmentList);
    } catch (err) {
      console.log(err);
    }
  }

  async function _fetchAllAssignments() {
    try {
      let userToken = localStorage.getItem("expertToken");
      if (userToken == null) {
        navigate("/expert/login");
      }

      let config = {
        headers: { Authorization: `Bearer ${userToken}` },
      };
      const response = await axios.get(apiUrl + "/assignment/fetch", config);
      let newData = response.data.assignmentData.filter(
        (data) => data.assignedExpert === selectedExpert
      );
      allAssignmentList = [];
      newData.length !== 0
        ? newData.forEach((data, index) => {
            allAssignmentList.push({
              _id: data._id,
              subject: data.subject,
              instructionFile: data.descriptionFile[0],
              assignDate:
                new Date(data.expertAssignedDate).toLocaleTimeString() +
                ", " +
                new Date(data.expertAssignedDate).toDateString(),
              expertDeadline:
                new Date(data.deadline).toLocaleTimeString() +
                ", " +
                new Date(data.deadline).toDateString(),
              deliveryDate:
                new Date(data.deliveryDate).toLocaleTimeString() +
                ", " +
                new Date(data.deliveryDate).toDateString(),
              pages_or_wordCount:
                (data.page_word_data || "") +
                " " +
                (data.display_page_word || ""),
              charges:
                data.charges === "Regular Charges"
                  ? "Regular Charges"
                  : "Special Charges",
              amount_Charges_Confirmed: data.charges || "",
              refund: "",
              payment_Status: "",
            });
          })
        : console.log("No CP1 Pending Orders");

      setAllAssignments(allAssignmentList);
    } catch (err) {
      console.log(err);
    }
  }

  const headers = [
    { label: "Task ID", key: "_id" },
    { label: "Subject", key: "subject" },
    { label: "Instruction File", key: "instructionFile" },
    { label: "Assign Date", key: "assignDate" },
    { label: "Deadline Date", key: "expertDeadline" },
    { label: "Delivery Date", key: "deliveryDate" },
    { label: "Pages/WordCount", key: "pages_or_wordCount" },
    { label: "Charges", key: "charges" },
    { label: "Amount(Charges Confirmed)", key: "amount_Charges_Confirmed" },
    { label: "Refund", key: "refund" },
    { label: "Payment Status", key: "payment_Status" },
  ];

  return (
    <>
      <Box padding={2} width={showData ? "30%" : "30%"}>
        <HStack>
          <FormControl padding={2}>
            <FormLabel fontWeight={"bold"}>Start Date::</FormLabel>
            <HStack>
              <Input
                type="date"
                id="date"
                value={date.startDate}
                onChange={(e) => {
                  setDate({
                    ...date,
                    startDate: e.target.value,
                  });
                }}
              />
            </HStack>
          </FormControl>
          <FormControl padding={2}>
            <FormLabel fontWeight={"bold"}>End Date::</FormLabel>
            <HStack>
              <Input
                type="date"
                id="date"
                value={date.endDate}
                onChange={(e) => {
                  setDate({
                    ...date,
                    endDate: e.target.value,
                  });
                }}
              />
            </HStack>
          </FormControl>
        </HStack>
        {error && !allData && (
          <span style={{ color: "red" }}>** Expert Deadline is mandatory</span>
        )}
        {error && !showData && (
          <span style={{ color: "red" }}>** Expert Selection is mandatory</span>
        )}
        <VStack
          display="flex"
          alignItems="center"
          justifyContent="space-around"
          flexDirection="row"
        >
          <Button
            marginTop="1rem"
            onClick={async (e) => {
              setShowData(true);
              setAllData(false);
              !date.startDate || !date.endDate
                ? setError(true)
                : setError(false);
              await _fetchAssignments();
            }}
          >
            Show Data
          </Button>
          <Button
            marginTop="1rem"
            onClick={async (e) => {
              setDate({
                startDate: "",
                endDate: "",
              });
              setAllData(true);
              setShowData(false);
              !selectedExpert ? setError(true) : setError(false);
              await _fetchAllAssignments();
            }}
          >
            All Data
          </Button>
        </VStack>
      </Box>
      <Box mt="1rem">
        <Table
          variant="simple"
          marginBottom="2rem"
          size="md"
          display={{ base: "none", sm: "block", md: "block" }}
        >
          <Thead bgColor={"gray.200"} borderWidth="1px">
            <Tr>
              <Th>ID</Th>
              <Th>Subject</Th>
              <Th>Instruction File</Th>
              <Th>Assign Date</Th>
              <Th>Deadline Date</Th>
              <Th>Delivery Date</Th>
              <Th>Pages/WordCount</Th>
              <Th>Charges</Th>
              <Th>Amount(Charges Confirmed)</Th>
              <Th>Refund</Th>
              <Th>Payment Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {(assignments.length !== 0 && !error) ||
            (allAssignments.length !== 0 && !error) ? (
              <>
                {showData ? (
                  assignments.map((assignment, index) => (
                    <Tr key={assignment._id} borderWidth="1px">
                      <Td fontWeight={"semibold"} borderWidth="1px">
                        <Link
                          href={"/admin/assignment_details/" + assignment._id}
                        >
                          {assignment._id}
                        </Link>
                      </Td>
                      <Td
                        color={"green.600"}
                        fontWeight={"semibold"}
                        borderWidth="1px"
                      >
                        {assignment.subject}
                      </Td>
                      <Td
                        color={"green.600"}
                        fontWeight={"semibold"}
                        borderWidth="1px"
                      >
                        {assignment.instructionFile}
                      </Td>
                      <Td
                        color={"green.600"}
                        fontWeight={"semibold"}
                        borderWidth="1px"
                      >
                        {assignment.assignDate}
                      </Td>
                      <Td
                        color={"red.600"}
                        fontWeight={"semibold"}
                        borderWidth="1px"
                      >
                        {assignment.expertDeadline}
                      </Td>
                      <Td
                        color={"green.600"}
                        fontWeight={"semibold"}
                        borderWidth="1px"
                      >
                        {assignment.deliveryDate}
                      </Td>
                      <Td fontWeight={"semibold"} borderWidth="1px">
                        {assignment.pages_or_wordCount}
                      </Td>
                      <Td fontWeight={"semibold"} borderWidth="1px">
                        {assignment.charges}
                      </Td>
                      <Td fontWeight={"semibold"} borderWidth="1px">
                        {assignment.amount_Charges_Confirmed}
                      </Td>
                      <Td fontWeight={"semibold"} borderWidth="1px">
                        <Checkbox value={assignment.refund} />
                      </Td>
                      <Td fontWeight={"semibold"} borderWidth="1px">
                        <Checkbox value={assignment.payment_Status} />
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <>
                    {allAssignments.map((assignment, index) => (
                      <Tr key={assignment._id} borderWidth="1px">
                        <Td fontWeight={"semibold"} borderWidth="1px">
                          <Link
                            href={"/admin/assignment_details/" + assignment._id}
                          >
                            {assignment._id}
                          </Link>
                        </Td>
                        <Td
                          color={"green.600"}
                          fontWeight={"semibold"}
                          borderWidth="1px"
                        >
                          {assignment.subject}
                        </Td>
                        <Td
                          color={"green.600"}
                          fontWeight={"semibold"}
                          borderWidth="1px"
                        >
                          {assignment.instructionFile}
                        </Td>
                        <Td
                          color={"green.600"}
                          fontWeight={"semibold"}
                          borderWidth="1px"
                        >
                          {assignment.assignDate}
                        </Td>
                        <Td
                          color={"red.600"}
                          fontWeight={"semibold"}
                          borderWidth="1px"
                        >
                          {assignment.expertDeadline}
                        </Td>
                        <Td
                          color={"green.600"}
                          fontWeight={"semibold"}
                          borderWidth="1px"
                        >
                          {assignment.deliveryDate}
                        </Td>
                        <Td fontWeight={"semibold"} borderWidth="1px">
                          {assignment.pages_or_wordCount}
                        </Td>
                        <Td fontWeight={"semibold"} borderWidth="1px">
                          {assignment.charges}
                        </Td>
                        <Td fontWeight={"semibold"} borderWidth="1px">
                          {assignment.amount_Charges_Confirmed}
                        </Td>
                        <Td fontWeight={"semibold"} borderWidth="1px">
                          <Checkbox value={assignment.refund} />
                        </Td>
                        <Td fontWeight={"semibold"} borderWidth="1px">
                          <Checkbox value={assignment.payment_Status} />
                        </Td>
                      </Tr>
                    ))}
                  </>
                )}
              </>
            ) : (
              <>
                <Box>No Data</Box>
              </>
            )}
          </Tbody>
        </Table>
        <VStack>
          {showData ? (
            <Button
              disabled={assignments.length !== 0 && !error ? false : true}
            >
              <CSVLink
                data={assignments}
                headers={headers}
                filename="ExpertAssignmentData"
              >
                Export Assignment
              </CSVLink>
            </Button>
          ) : (
            <Button
              disabled={allAssignments.length !== 0 && !error ? false : true}
            >
              <CSVLink
                data={allAssignments}
                headers={headers}
                filename="ExpertAssignmentData"
              >
                Export Assignment
              </CSVLink>
            </Button>
          )}
        </VStack>
      </Box>
    </>
  );
}

export default GetExcelData;
