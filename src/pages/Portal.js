import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import LoginLayout from "./LoginLayout";
import Calendar from "../components/Calendar";
import GetExcelData from "../components/ExcelData";
import Messages from "../components/Messages";

function Portal() {
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
                {tabIndex === 1 && <Messages />}
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
