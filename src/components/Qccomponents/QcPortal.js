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
import { useEffect, useState } from "react";
import QcOrder from "./Qcorder/QcOrder";
import QcLoginLayout from "./QcLoginLayout";
function QcPortal() {
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
      <QcLoginLayout />
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
            <TabList display={{ base: "none", sm: "block", md: "block" }}>
              <Tab>
                <Heading fontSize={"md"}>Orders</Heading>
              </Tab>
            </TabList>

            <TabPanels display={{ base: "none", sm: "block", md: "block" }}>
              <TabPanel>{tabIndex === 0 && <QcOrder />}</TabPanel>
            </TabPanels>
          </Tabs>
        </>
      </Box>
    </>
  );
}

export default QcPortal;
