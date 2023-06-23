import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
} from "@chakra-ui/react";
import ExpertDeadlineListView from "./ExpertDeadlineListView";
import ExpertDeadlineCalendarView from "./ExpertDeadlineCalendarView";
function Calendars() {
  return (
    <>
      <div className="ShowSideClick">
        <Box padding={0}>
          <Tabs isLazy variant="soft-rounded">
            <TabList>
              <Tab>
                <Heading fontSize={"sm"}>By Date</Heading>
              </Tab>
              <Tab>
                <Heading fontSize={"sm"}>By List</Heading>
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <ExpertDeadlineCalendarView />
              </TabPanel>
              <TabPanel>
                <ExpertDeadlineListView />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </div>
    </>
  );
}

export default Calendars;
