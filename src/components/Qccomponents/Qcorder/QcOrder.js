import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
//   import { useRouter } from "next/router";
import { useNavigate } from "react-router-dom";
//   import { isMobile } from "react-device-detect";
import { db } from "../../../services/firebase";
import axios from "axios";
import { apiUrl, frontEndUrl } from "../../../services/contants";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import ProofReadOrders from "../ProofReadOrders";
import CP2DoneOrders from "../CP2DoneOrders";
import InternalReworkOrders from "../InternalReworkOrders";
import RawSubmissionOrders from "../RawSubmissionOrders";

function QcOrder() {
  const [messageData, setMessageData] = useState([]);
  const [confirmedOperatorExpertChat, setConfirmedOperatorExpertChat] =
    useState({});
  const [processOperatorExpertChat, setProcessOperatorExpertChat] = useState(
    {}
  );
  const [inProcessOrderData, setInProcessOrderData] = useState([]);
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [inProcessOrders, setInProcessOrders] = useState([]);
  let confirmOrderAssignedExpertMessages,
    inProcessOrderAssignedExpertMessages,
    confirmedMessageData,
    inProcessMessageData;
  const [userRole, setUserRole] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationCounter, setNotificationCounter] = useState({});
  const [tabIndex, setTabIndex] = useState(
    (typeof window !== "undefined" &&
      Number(localStorage.getItem("ordersTabIndex"))) ||
      0
  );

  const navigate = useNavigate();
  const NotificationModalDis = useDisclosure();

  useEffect(async () => {
    setUserRole(localStorage.getItem("userRole"));
  }, []);

  useEffect(() => {
    localStorage.setItem("ordersTabIndex", tabIndex);
  }, [tabIndex]);

  useEffect(() => {
    _fetchMessages();
    _fetchConfirmedOrders();
    _fetchInProcessOrders();
    (async () => {
      const {
        data: { result: counts },
      } = await axios.get(apiUrl + "/notifications/countByStatus");

      if (counts) {
        const countMap = Object.fromEntries(
          counts.map(({ _id, count }) => [_id, count])
        );
        setNotificationCounter(countMap);
      }
    })();
  }, []);

  async function _fetchConfirmedOrders() {
    try {
      let clientToken = localStorage.getItem("userToken");
      if (clientToken == null) {
        navigate("/admin/login");
      }

      let config = {
        headers: { Authorization: `Bearer ${clientToken}` },
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
      let data = await response.data.assignmentData;
      if (data && data.length !== 0) {
        setConfirmedOrders(data);
      } else {
        console.log("Assignment Not Found");
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function _fetchInProcessOrders() {
    try {
      let clientToken = localStorage.getItem("userToken");
      if (clientToken == null) {
        navigate("/admin/login");
      }

      let config = {
        headers: { Authorization: `Bearer ${clientToken}` },
      };
      const response = await axios.post(
        apiUrl + "/assignment/fetch",
        {
          status: {
            $in: ["Expert Asked"],
          },
        },
        config
      );
      let data = await response.data.assignmentData;
      if (data && data.length !== 0) {
        setInProcessOrders(data);
      } else {
        console.log("Assignment Not Found");
      }
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    (async () => {
      if (confirmedMessageData && confirmedMessageData.length !== 0) {
        confirmedMessageData.map(async (msg) => {
          await _fetchConfirmedOperatorExpertChat(msg.expertEmail, msg._id);
        });
      }
      if (inProcessMessageData && inProcessMessageData.length !== 0) {
        inProcessMessageData.map(async (msg) => {
          const emails = msg.allExperts || [msg.expertEmail];
          await Promise.all(
            emails.map((email) =>
              _fetchProcessOperatorExpertChat(email, msg._id)
            )
          );
        });
      }
    })();
  }, [messageData, confirmedOrders, inProcessOrders]);

  useEffect(() => {
    (async () => {
      await _fetchInProcessOrdersData();
    })();
  }, [processOperatorExpertChat]);

  async function _fetchMessages() {
    try {
      const response = await axios.get(apiUrl + "/messages");
      let data = await response.data;
      if (data.success) {
        setMessageData(data.result);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function _fetchConfirmedOperatorExpertChat(expertEmail, assignment_id) {
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
        setConfirmedOperatorExpertChat((operatorExpertChat) => ({
          ...operatorExpertChat,
          [assignment_id]: doc.data().conversation,
        }));
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function _fetchProcessOperatorExpertChat(expertEmail, assignment_id) {
    try {
      const chatName =
        expertEmail + "_" + "InProcess_order_chat" + "_" + assignment_id;
      const chatDoc = await getDoc(doc(db, "chat", chatName));
      if (!chatDoc.exists()) {
        await setDoc(doc(db, "chat", chatName), {
          conversation: [],
        });
      }
      const unsubChat = onSnapshot(doc(db, "chat", chatName), (doc) => {
        setProcessOperatorExpertChat((operatorExpertChat) => ({
          ...operatorExpertChat,
          [`${assignment_id}_${expertEmail}`]: doc.data().conversation,
        }));
      });
    } catch (error) {
      console.log(error);
    }
  }

  if (
    confirmedOrders.length !== 0 &&
    inProcessOrders.length !== 0 &&
    messageData.length !== 0
  ) {
    confirmedMessageData = messageData.filter((data) => {
      return confirmedOrders.some((val) => val._id === data._id);
    });
    inProcessMessageData = messageData.filter((data) => {
      return inProcessOrders.some((val) => val._id === data._id);
    });
  }

  if (Object.keys(processOperatorExpertChat).length !== 0) {
    inProcessOrderAssignedExpertMessages = Object.keys(
      processOperatorExpertChat
    ).map((key) => {
      const data = processOperatorExpertChat[key];
      const date =
        data.length !== 0 &&
        new Date(data[data.length - 1].time).toLocaleDateString("en-US");
      return {
        id: key,
        chat: data,
        date: date,
      };
    });
  }

  async function _fetchInProcessOrdersData() {
    if (
      inProcessOrderAssignedExpertMessages &&
      inProcessOrderAssignedExpertMessages.length !== 0
    ) {
      let objd = {};
      let finlAr = [];
      const uniqueIds = [
        ...new Set(
          inProcessOrderAssignedExpertMessages.map(
            (data) => data.id.split("_")[0]
          )
        ),
      ];
      for (var i = 0; i < inProcessOrderAssignedExpertMessages.length; i++) {
        objd.id = inProcessOrderAssignedExpertMessages[i].id.split("_")[0];
        objd.date = inProcessOrderAssignedExpertMessages[i].date;
        objd.expertEmail =
          inProcessOrderAssignedExpertMessages[i].id.split("_")[1];
        objd.expertChat = inProcessOrderAssignedExpertMessages[i].chat.filter(
          (msg) => {
            return (
              msg.user ===
              inProcessOrderAssignedExpertMessages[i].id.split("_")[1]
            );
          }
        );

        finlAr.push({ ...objd });
      }

      const studentsByID = finlAr.reduce(
        (obj, { id, date, expertChat, expertEmail }) => {
          if (!obj.hasOwnProperty(id)) {
            obj[id] = { id, experts: [] };
          }
          obj[id].experts = [
            ...obj[id].experts,
            { date, expertEmail, expertChat },
          ];
          return obj;
        },
        {}
      );
      const data = Object.entries(studentsByID)
        .flat()
        .filter((data) => {
          return !uniqueIds.some((id) => id == data);
        })
        .filter((data) => {
          return data.experts.some((val) => val.expertChat.length !== 0);
        });
      if (data.length !== 0) {
        setInProcessOrderData(data);
      }
    }
  }

  const incrementCounter = (status) => {
    setNotificationCounter((_counters) => ({
      ..._counters,
      [status]: _counters[status] + 1 || 1,
    }));
  };

  const decrementCounter = (status) => {
    setNotificationCounter((_counters) => ({
      ..._counters,
      [status]: _counters[status] && _counters[status] - 1,
    }));
  };

  async function readNotification(notification) {
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

      const response = await axios.put(
        apiUrl + "/notifications/read",
        {
          assignmentId: notification._id,
        },
        config
      );
      let resData = response.data.result;
      if (response.data.success) {
        await NotificationModalDis.onClose();
        decrementCounter(notification.status);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function openNotificationModal(status) {
    try {
      let userToken = localStorage.getItem("userToken");
      if (userToken == null) {
        navigate("/admin/login");
      }

      let config = {
        headers: { Authorization: `Bearer ${userToken}` },
      };

      const response = await axios.get(
        apiUrl + `/notifications?status=${status}`,
        config
      );
      let resData = response.data.result;
      setNotifications(resData);
    } catch (err) {
      console.log(err);
    }

    NotificationModalDis.onOpen();
  }

  function NotificationModal(status) {
    return (
      <Modal
        size={"sm"}
        onClose={NotificationModalDis.onClose}
        isOpen={NotificationModalDis.isOpen}
        onOpen={NotificationModalDis.onOpen}
        isCentered
      >
        <ModalOverlay />
        <ModalContent maxH={"500px"} overflowY="scroll">
          <ModalHeader>New Notification</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Table marginTop={2} variant="simple" size="sm">
              <Thead bgColor={"gray.200"}>
                <Tr>
                  <Th>ID</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {notifications && notifications.length === 0 ? (
                  <></>
                ) : (
                  notifications &&
                  notifications.map((notification, index) => (
                    <Tr key={notification._id}>
                      <Td fontWeight={"semibold"}>
                        <a
                          href={
                            frontEndUrl +
                            "/admin/assignment_details/" +
                            notification._id
                          }
                          target="_blank"
                          onClick={() => readNotification(notification)}
                        >
                          {notification._id}
                        </a>
                      </Td>
                      <Td className="d-flex justify-content-end">
                        <Button onClick={() => readNotification(notification)}>
                          <span>✅</span>
                        </Button>
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

  if (Object.keys(confirmedOperatorExpertChat).length !== 0) {
    confirmOrderAssignedExpertMessages = Object.keys(
      confirmedOperatorExpertChat
    ).map((key) => {
      const data = confirmedOperatorExpertChat[key];
      const values = data.filter((f) => {
        return confirmedMessageData.some((val) => val.expertEmail === f.user);
      });
      const date =
        values.length !== 0 &&
        new Date(values[values.length - 1].time).toLocaleDateString("en-US");
      return {
        id: key,
        chat: values,
        date: date,
      };
    });
  }

  return (
    <>
      <NotificationModal />
      <Box padding={0}>
        <>
          <Tabs
            isLazy
            variant="soft-rounded"
            onChange={(index) => setTabIndex(index)}
            index={tabIndex}
          >
            <TabList>
              <Tab style={{ borderRadius: "5px" }}>
                <Heading fontSize={"lg"}>Raw Submission</Heading>
              </Tab>
              <div
                className="text-center"
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "5px",
                  background: "#c96969",
                  cursor: "pointer",
                  margin: "2px 5px",
                  color: "#fff",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
                onClick={async () => openNotificationModal("Raw Submission")}
              >
                {notificationCounter["Raw Submission"]}
              </div>
              <Tab style={{ borderRadius: "5px" }}>
                <Heading fontSize={"lg"}>Internal Rework</Heading>
              </Tab>
              <div
                className="text-center"
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "5px",
                  background: "#c96969",
                  cursor: "pointer",
                  margin: "2px 5px",
                  color: "#fff",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
                onClick={async () => openNotificationModal("Internal Rework")}
              >
                {notificationCounter["Internal Rework"]}
              </div>
              <Tab style={{ borderRadius: "5px" }}>
                <Heading fontSize={"lg"}>Proof Read</Heading>
              </Tab>
              <div
                className="text-center"
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "5px",
                  background: "#c96969",
                  cursor: "pointer",
                  margin: "2px 5px",
                  color: "#fff",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
                onClick={async () => openNotificationModal("Proof Read")}
              >
                {notificationCounter["Proof Read"]}
              </div>
              <Tab style={{ borderRadius: "5px" }}>
                <Heading fontSize={"lg"}>CP2 Done</Heading>
              </Tab>
              <div
                className="text-center"
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "5px",
                  background: "#c96969",
                  cursor: "pointer",
                  margin: "2px 5px",
                  color: "#fff",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
                onClick={async () => openNotificationModal("CP2 Done")}
              >
                {notificationCounter["CP2 Done"]}
              </div>
            </TabList>

            <TabPanels>
              <TabPanel>
                {tabIndex === 0 && (
                  <RawSubmissionOrders
                    incrementCounter={incrementCounter}
                    decrementCounter={decrementCounter}
                  />
                )}
              </TabPanel>
              <TabPanel>
                {tabIndex === 1 && (
                  <InternalReworkOrders
                    incrementCounter={incrementCounter}
                    decrementCounter={decrementCounter}
                  />
                )}
              </TabPanel>
              <TabPanel>
                {tabIndex === 2 && (
                  <ProofReadOrders
                    incrementCounter={incrementCounter}
                    decrementCounter={decrementCounter}
                  />
                )}
              </TabPanel>
              <TabPanel>
                {tabIndex === 3 && (
                  <CP2DoneOrders
                    incrementCounter={incrementCounter}
                    decrementCounter={decrementCounter}
                  />
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </>
      </Box>

      {/* mobile  */}
      {/* {isMobile && (
          <Box
            display={{ base: "block", sm: "none", md: "none " }}
            id="parent_tabOrder"
          >
            <FreshOrders />
            <CP1PendingOrders />
            <CP1DoneOrders />
            <ExpertAskedOrders />
            <AssignedExpertOrders />
            <RawSubmissionOrders />
            <InternalReworkOrders />
            <ProofReadOrders />
            <CP2DoneOrders />
            <ClientReworkOrders />
          </Box>
        )} */}
    </>
  );
}

export default QcOrder;
