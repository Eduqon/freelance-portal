import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  Spinner,
} from "@chakra-ui/react";
import { ChatIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";
import LoginLayout from "./LoginLayout";
import Calendar from "../components/Calendar";
import GetExcelData from "../components/ExcelData";
import Messages from "../components/Messages";

function Portal() {
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(
    (typeof window !== "undefined" &&
      Number(localStorage.getItem("tabIndex"))) ||
      0
  );

  useEffect(() => {
    localStorage.setItem("tabIndex", tabIndex);
  }, [tabIndex]);

  return (
    <>
      <LoginLayout />
      <Box padding={"10px"} position={"relative"}>
        <>
          <Tabs
            position={"absolute"}
            orientation="vertical"
            variant="solid-rounded"
            display={{ base: "none", sm: "inline-flex", md: "inline-flex" }}
            onChange={(index) => setTabIndex(index)}
            index={tabIndex}
          >
            <TabList>
              <Tab>
                <Heading fontSize={"md"}>Confirmed Orders</Heading>
              </Tab>
              <Tab>
                <Heading fontSize={"md"}>Messages</Heading>
                <Box
                  display="flex"
                  alignItems={"center"}
                  position="relative"
                  marginLeft={2}
                >
                  <ChatIcon width={"1.5em"} height={"1.5em"} />
                  {messageCount !== 0 ? (
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
                      {messageCount}
                    </Box>
                  ) : (
                    loading && (
                      <Box
                        display={"flex"}
                        alignItems={"center"}
                        justifyContent={"center"}
                        marginLeft={2}
                        position={"absolute"}
                        right={"-10px"}
                        top={"-10px"}
                      >
                        <Spinner />
                      </Box>
                    )
                  )}
                </Box>
              </Tab>
              <Tab>
                <Heading fontSize={"md"}>Excel Data</Heading>
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel
                style={
                  tabIndex === 0 ? { display: "block" } : { display: "none" }
                }
              >
                {tabIndex === 0 && <Calendar />}
              </TabPanel>
              <TabPanel
                style={
                  tabIndex === 1 ? { display: "block" } : { display: "none" }
                }
              >
                <Messages
                  setMessageCount={setMessageCount}
                  setSpinnerLoading={setLoading}
                />
              </TabPanel>
              <TabPanel
                style={
                  tabIndex === 2 ? { display: "block" } : { display: "none" }
                }
              >
                {tabIndex === 2 && <GetExcelData />}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </>
      </Box>
    </>
  );
}

export default Portal;
