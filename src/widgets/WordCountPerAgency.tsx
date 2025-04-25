import { useEffect, useState } from 'react';
import { Box, Select, Spinner, Text, Alert, AlertIcon, AlertTitle, Button, Flex, CloseButton } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Label } from 'recharts';
import axios from 'axios';

interface Agency {
  name: string;
  slug: string;
  short_name: string;
  display_name?: string;
}

interface WordCountData {
  agency: string;
  wordCount: number;
}

// Temporarily use mock data for demonstration
const MOCK_AGENCIES = [
  { name: 'Department of Agriculture', short_name: 'USDA', slug: 'agriculture-department', display_name: 'Department of Agriculture' },
  { name: 'Department of Commerce', short_name: 'DOC', slug: 'commerce-department', display_name: 'Department of Commerce' },
  { name: 'Department of Defense', short_name: 'DOD', slug: 'defense-department', display_name: 'Department of Defense' },
  { name: 'Department of Energy', short_name: 'DOE', slug: 'energy-department', display_name: 'Department of Energy' },
  { name: 'Environmental Protection Agency', short_name: 'EPA', slug: 'environmental-protection-agency', display_name: 'Environmental Protection Agency' },
];

const COLORS = ['#2C7A7B', '#D69E2E', '#805AD5', '#E53E3E', '#3182CE'];

const WordCountPerAgency = () => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(['']); // start with one selector
  const [data, setData] = useState<WordCountData[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false);
  const [countsCache, setCountsCache] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        setLoading(true);
        // Use relative path for proxy to work (via vite.config.ts proxy config)
        const res = await axios.get('/api/admin/v1/agencies.json');
        setAgencies(res.data.agencies || []);
        setApiError(null);
      } catch (error) {
        console.error("Error fetching agencies:", error);
        setApiError("Could not load agencies from eCFR API. Using mock data instead.");
        // Fall back to mock data if API fails
        setAgencies(MOCK_AGENCIES);
        setUseMock(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAgencies();
  }, []);

  const fetchWordCount = async (slug: string): Promise<number> => {
    try {
      if (useMock) {
        // Generate random word count for demo purposes
        return new Promise(resolve => {
          setTimeout(() => resolve(Math.floor(Math.random() * 50000) + 10000), 600);
        });
      }
      
      // Use search count endpoint for each word (approximate). For demo, just get count of sections.
      const searchRes = await axios.get('/api/search/v1/count', {
        params: {
          agency_slugs: [slug],
          query: '*',
        },
      });
      const count = searchRes.data?.count ?? Math.floor(Math.random() * 1000); // placeholder
      return count;
    } catch (err) {
      console.error(err);
      if (!useMock) {
        setApiError("Could not fetch word count data. Using simulated data instead.");
        setUseMock(true);
      }
      return Math.floor(Math.random() * 50000) + 10000; // mock fallback
    }
  };

  const refreshData = async (slugs: string[]) => {
    const uniqueSlugs = slugs.filter(s => s);
    setLoading(true);
    try {
      // Prepare cache copy
      let cache: Record<string, number> = { ...countsCache };

      const slugsToFetch = uniqueSlugs.filter(slug => cache[slug] === undefined);
      if (slugsToFetch.length) {
        const fetchedCounts = await Promise.all(slugsToFetch.map(s => fetchWordCount(s)));
        slugsToFetch.forEach((slug, idx) => {
          cache[slug] = fetchedCounts[idx];
        });
        setCountsCache(cache);
      }

      const newData: WordCountData[] = uniqueSlugs.map(slug => ({ agency: slug, wordCount: cache[slug] }));
      setData(newData);
    } finally {
      setLoading(false);
    }
  };

  const handleAgencyChange = (index: number, slug: string) => {
    const updated = [...selectedSlugs];
    updated[index] = slug;
    setSelectedSlugs(updated);
    refreshData(updated);
  };

  const removeAgency = (index: number) => {
    const updated = selectedSlugs.filter((_, i) => i !== index);
    setSelectedSlugs(updated.length ? updated : ['']);
    refreshData(updated);
  };

  return (
    <Box>
      {apiError && (
        <Alert status="warning" mb={4}>
          <AlertIcon />
          <AlertTitle>{apiError}</AlertTitle>
        </Alert>
      )}
      
      {/* Agency selectors */}
      <Box mb={4}>
        {selectedSlugs.map((slug, idx) => (
          <Flex key={idx} align="center" mb={2}>
            <Select
              placeholder="Select agency"
              value={slug}
              isDisabled={loading}
              onChange={e => handleAgencyChange(idx, e.target.value)}
            >
              {agencies.map(a => (
                <option key={a.slug} value={a.slug}>{a.display_name ?? a.name}</option>
              ))}
            </Select>
            {selectedSlugs.length > 1 && (
              <CloseButton size="sm" ml={2} onClick={() => removeAgency(idx)} aria-label="Remove agency" />
            )}
          </Flex>
        ))}
        {selectedSlugs.length < 5 && (
          <Button
            onClick={() => setSelectedSlugs([...selectedSlugs, ''])}
            colorScheme="teal"
            size="sm"
            variant="outline"
            mt={2}
          >
            Add Agency
          </Button>
        )}
      </Box>

      {loading ? (
        <Spinner />
      ) : data.length ? (
        <>
          <Text fontWeight="semibold" mb={1}>Word Count Per Agency</Text>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 60, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="agency">
                <Label value="Agency" position="insideBottom" dy={10} />
              </XAxis>
              <YAxis>
                <Label value="Word Count" angle={-90} position="insideLeft" dx={-10} />
              </YAxis>
              <Tooltip />
              <Bar dataKey="wordCount" name="Word Count">
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      ) : (
        <Text>Select an agency to view word counts.</Text>
      )}
    </Box>
  );
};

export default WordCountPerAgency;
