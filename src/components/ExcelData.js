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
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
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
  const [expertEmail, setExpertEmail] = useState("");

  let navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem("expertEmail");
    if (email) {
      setExpertEmail(email);
    }
  }, [expertEmail]);

  async function _fetchAssignments(statusFilter) {
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
        (data) => data.assignedExpert === expertEmail
      );
      let filterData =
        newData &&
        newData.filter(
          (data) =>
            new Date(data.expertDeadline[data._id][0]).toLocaleDateString() >=
              new Date(date.startDate).toLocaleDateString() &&
            new Date(data.expertDeadline[data._id][0]).toLocaleDateString() <=
              new Date(date.endDate).toLocaleDateString()
        );
      const statusFilteredData = statusFilter
        ? filterData.filter((data) => data.status === statusFilter)
        : filterData;
      assignmentList = [];
      statusFilteredData.length !== 0
        ? statusFilteredData.forEach((data, index) => {
            assignmentList.push({
              _id: data._id,
              subject: data.subject,
              expertDeadline: data.expertDeadline
                ? new Date(
                    data.expertDeadline[data._id][0]
                  ).toLocaleTimeString() +
                  ", " +
                  new Date(data.expertDeadline[data._id][0]).toDateString()
                : "",
              pages_or_wordCount:
                (data.page_word_data || "") +
                " " +
                (data.display_page_word || ""),
              amount_Charges_Confirmed: data.charges || "",
              status: data.status,
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
        (data) => data.assignedExpert === expertEmail
      );
      allAssignmentList = [];
      newData.length !== 0
        ? newData.forEach((data, index) => {
            allAssignmentList.push({
              _id: data._id,
              subject: data.subject,
              expertDeadline: data.expertDeadline
                ? new Date(
                    data.expertDeadline[data._id][0]
                  ).toLocaleTimeString() +
                  ", " +
                  new Date(data.expertDeadline[data._id][0]).toDateString()
                : "",
              pages_or_wordCount:
                (data.page_word_data || "") +
                " " +
                (data.display_page_word || ""),
              amount_Charges_Confirmed: data.charges || "",
              status: data.status,
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
    { label: "Expert Deadline", key: "expertDeadline" },
    { label: "Pages/WordCount", key: "pages_or_wordCount" },
    { label: "Amount(Charges Confirmed)", key: "amount_Charges_Confirmed" },
    { label: "Status", key: "status" },
  ];

  const status = ["Expert Assigned", "Proof Read", "CP2 Done"];

  async function handleStatus(selectedValue) {
    _fetchAssignments(selectedValue);
  }

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
              !expertEmail ? setError(true) : setError(false);
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
              <Th>Expert Deadline</Th>
              <Th>Pages/WordCount</Th>
              <Th>Payment Confirmed</Th>
              <Th>
                {showData ? (
                  <select
                    style={{
                      background: "none",
                      outline: "none",
                      fontWeight: "600",
                      fontSize: "1rem",
                    }}
                    onChange={(e) => handleStatus(e.target.value)}
                  >
                    <option>Select Status</option>
                    {status.map((val) => (
                      <option value={val}>{val}</option>
                    ))}
                  </select>
                ) : (
                  "Status"
                )}
              </Th>
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
                        <Link href={"/assignment_details/" + assignment._id}>
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
                        color={"red.600"}
                        fontWeight={"semibold"}
                        borderWidth="1px"
                      >
                        {assignment.expertDeadline}
                      </Td>
                      <Td fontWeight={"semibold"} borderWidth="1px">
                        {assignment.pages_or_wordCount}
                      </Td>
                      <Td fontWeight={"semibold"} borderWidth="1px">
                        {assignment.amount_Charges_Confirmed}
                      </Td>
                      <Td fontWeight={"semibold"} borderWidth="1px">
                        {assignment.status}
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <>
                    {allAssignments.map((assignment, index) => (
                      <Tr key={assignment._id} borderWidth="1px">
                        <Td fontWeight={"semibold"} borderWidth="1px">
                          <Link href={"/assignment_details/" + assignment._id}>
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
                          color={"red.600"}
                          fontWeight={"semibold"}
                          borderWidth="1px"
                        >
                          {assignment.expertDeadline}
                        </Td>
                        <Td fontWeight={"semibold"} borderWidth="1px">
                          {assignment.pages_or_wordCount}
                        </Td>
                        <Td fontWeight={"semibold"} borderWidth="1px">
                          {assignment.amount_Charges_Confirmed}
                        </Td>
                        <Td fontWeight={"semibold"} borderWidth="1px">
                          {assignment.status}
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
