import { Tabs, TabList, TabPanels, Tab, TabPanel, Heading } from '@chakra-ui/react';
import WordCountPerAgency from '../widgets/WordCountPerAgency';
import HistoricalChanges from '../widgets/HistoricalChanges';

const App = () => {
  return (
    <>
      <Heading as="h1" size="xl" textAlign="center" mb={6}>eCFR Analyzer</Heading>
      <Tabs variant="enclosed" colorScheme="teal" isFitted>
        <TabList mb="1em">
          <Tab>Word Count per Agency</Tab>
          <Tab>Historical Changes Over Time</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <WordCountPerAgency />
          </TabPanel>
          <TabPanel>
            <HistoricalChanges />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
};

export default App;
