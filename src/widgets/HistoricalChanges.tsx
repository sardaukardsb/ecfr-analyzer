import { useEffect, useState } from 'react';
import { Box, Input, Spinner, Text, Button, Alert, AlertIcon, AlertTitle } from '@chakra-ui/react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ChangePoint {
  date: string;
  count: number;
}

// Mock data for demonstration when API is unavailable
const MOCK_DATA: ChangePoint[] = [
  { date: '2022-01-15', count: 42 },
  { date: '2022-02-15', count: 56 },
  { date: '2022-03-15', count: 78 },
  { date: '2022-04-15', count: 35 },
  { date: '2022-05-15', count: 85 },
  { date: '2022-06-15', count: 120 },
  { date: '2022-07-15', count: 68 },
  { date: '2022-08-15', count: 92 },
  { date: '2022-09-15', count: 110 },
  { date: '2022-10-15', count: 73 },
  { date: '2022-11-15', count: 65 },
  { date: '2022-12-15', count: 89 }
];

// Use relative API paths with the Vite proxy
// const API_BASE = 'https://www.ecfr.gov';

const HistoricalChanges = () => {
  const [query, setQuery] = useState('climate');
  const [data, setData] = useState<ChangePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false);

  const fetchChanges = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (useMock) {
        // Simulate API delay with mock data
        setTimeout(() => {
          // Filter mock data based on query to simulate search
          if (query.trim().length > 0) {
            const filteredData = [...MOCK_DATA];
            // Adjust counts based on query to simulate different results
            const multiplier = query.length / 5;
            const adjustedData = filteredData.map(point => ({
              ...point,
              count: Math.floor(point.count * multiplier)
            }));
            setData(adjustedData);
          } else {
            setData([]);
            setError("Please enter a search term");
          }
          setLoading(false);
        }, 800);
        return;
      }
      
      // Use relative path for proxy to work (via vite.config.ts proxy config)
      const res = await axios.get('/api/search/v1/counts/daily', {
        params: {
          query,
          per_page: 1000,
        },
      });
      
      // Check if we got valid data
      if (!res.data || !res.data.counts) {
        throw new Error("Invalid response format from API");
      }
      
      // Expect res.data.counts array with {date,count}, maybe transform
      const points: ChangePoint[] = (res.data.counts || []).map((c: any) => ({
        date: c.date,
        count: c.count,
      }));
      
      setData(points);
      if (points.length === 0) {
        setError("No data found for this search term");
      }
    } catch (err) {
      console.error("API error:", err);
      setError("Error fetching data. Using simulated data instead.");
      setApiError("Could not connect to eCFR API. Using simulated data for demonstration.");
      
      // Fall back to mock data
      setUseMock(true);
      
      // Generate mock data based on search term
      const filteredData = [...MOCK_DATA];
      const multiplier = Math.max(1, query.length / 5);
      const adjustedData = filteredData.map(point => ({
        ...point,
        count: Math.floor(point.count * multiplier)
      }));
      setData(adjustedData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      {apiError && (
        <Alert status="warning" mb={4}>
          <AlertIcon />
          <AlertTitle>{apiError}</AlertTitle>
        </Alert>
      )}
      
      <Box display="flex" mb={4}>
        <Input 
          placeholder="Search term" 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          onKeyDown={e => e.key==='Enter' && fetchChanges()} 
          mr={2}
        />
        <Button colorScheme="teal" onClick={fetchChanges} isLoading={loading}>
          Search
        </Button>
      </Box>
      
      {loading ? (
        <Spinner />
      ) : error ? (
        <Text color="red.500">{error}</Text>
      ) : data.length ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#2C7A7B" name="Results" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Text>No data available. Try another search term.</Text>
      )}
    </Box>
  );
};

export default HistoricalChanges;
