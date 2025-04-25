import { Tabs, TabList, TabPanels, Tab, TabPanel, Heading } from '@chakra-ui/react';
import WordCountPerAgency from '../widgets/WordCountPerAgency';
import HistoricalChanges from '../widgets/HistoricalChanges';
import HistoricalAgencyChanges from '../widgets/HistoricalAgencyChanges';

const App = () => {
  return (
    <>
      <Heading as="h1" size="2xl" textAlign="center" mb={8} fontWeight="extrabold" color="teal.600" textShadow="0 2px 4px rgba(0,0,0,0.1)">eCFR Analyzer</Heading>
      <Tabs variant="enclosed" colorScheme="teal" isFitted>
        <TabList mb="1em">
          <Tab>Word Count per Agency</Tab>
          <Tab>Historical Term Usage</Tab>
          <Tab>Historical Agency Changes</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <WordCountPerAgency />
          </TabPanel>
          <TabPanel>
            <HistoricalChanges />
          </TabPanel>
          <TabPanel>
            <HistoricalAgencyChanges />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
};

export default App;
