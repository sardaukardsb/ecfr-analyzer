import { useEffect, useState } from 'react';
import { Box, Input, Spinner, Text, Button, Alert, AlertIcon, AlertTitle, FormControl, FormLabel, Select } from '@chakra-ui/react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Label } from 'recharts';

interface ChangePoint {
  date: string;
  count: number;
}

// Enhanced mock data for demonstration
const MOCK_DATA: ChangePoint[] = [
  { date: '2023-01-15', count: 42 },
  { date: '2023-02-15', count: 56 },
  { date: '2023-03-15', count: 78 },
  { date: '2023-04-15', count: 35 },
  { date: '2023-05-15', count: 85 },
  { date: '2023-06-15', count: 120 },
  { date: '2023-07-15', count: 68 },
  { date: '2023-08-15', count: 92 },
  { date: '2023-09-15', count: 110 },
  { date: '2023-10-15', count: 73 },
  { date: '2023-11-15', count: 65 },
  { date: '2023-12-15', count: 89 },
  { date: '2024-01-15', count: 95 },
  { date: '2024-02-15', count: 105 },
  { date: '2024-03-15', count: 115 },
  { date: '2024-04-15', count: 88 }
];

// Use the corrections API to get real historical data
const HistoricalChanges = () => {
  const [query, setQuery] = useState('climate');
  const [data, setData] = useState<ChangePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('1year');
  
  // Try real API first; fall back to mock if it fails
  const [useMock, setUseMock] = useState(false);

  const fetchChanges = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. If mock flag is on, immediately return simulated data
      if (useMock) {
        // Simulate API delay with mock data (realistic simulation)
        setTimeout(() => {
          // Filter mock data based on query and time range
          if (query.trim().length > 0) {
            // Get date limit based on timeRange
            const now = new Date();
            let limitDate: Date | null = new Date();
            if (timeRange === '1month') {
              limitDate.setMonth(now.getMonth() - 1);
            } else if (timeRange === '6months') {
              limitDate.setMonth(now.getMonth() - 6);
            } else if (timeRange === '1year') {
              limitDate.setFullYear(now.getFullYear() - 1);
            } else if (timeRange === '5years') {
              limitDate.setFullYear(now.getFullYear() - 5);
            }
            
            // Filter data by date
            let filteredData = MOCK_DATA;
            if (timeRange !== 'all' && limitDate) {
              const limitDateStr = limitDate.toISOString().split('T')[0];
              filteredData = MOCK_DATA.filter(item => item.date >= limitDateStr);
            }
            
            // Calculate "relevance" of search term for each data point
            // This simulates how different search terms would affect results
            const queryRelevance = (query.length / 10) + 
                                 (query.toLowerCase().includes('climate') ? 1.5 : 1) *
                                 (query.toLowerCase().includes('energy') ? 1.3 : 1) *
                                 (query.toLowerCase().includes('regulation') ? 1.4 : 1);
            
            const adjustedData = filteredData.map(point => ({
              ...point,
              count: Math.floor(point.count * queryRelevance)
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
      
      // 2. Attempt primary endpoint: counts by date
      const now = new Date();
      let startDate: Date | null = new Date(now);
      if (timeRange === '1month') startDate.setMonth(now.getMonth() - 1);
      else if (timeRange === '6months') startDate.setMonth(now.getMonth() - 6);
      else if (timeRange === '1year') startDate.setFullYear(now.getFullYear() - 1);
      else if (timeRange === '5years') startDate.setFullYear(now.getFullYear() - 5);

      const fmt = (d: Date) => d.toISOString().split('T')[0];

      try {
        const res = await axios.get('/api/search/v1/counts/daily', {
          params: {
            query: query.trim() || '*',
            ...(timeRange !== 'all' && startDate && {
              last_modified_on_or_after: fmt(startDate),
              last_modified_on_or_before: fmt(now),
            }),
          },
        });

        if (res.data && res.data.dates) {
          const points: ChangePoint[] = Object.entries(res.data.dates)
            .map(([date, count]) => ({ date, count: count as number }))
            .sort((a, b) => a.date.localeCompare(b.date));
          setData(points);
          if (!points.length) {
            setError('No results found for this term in the selected range');
          }
          return; // success
        }
        throw new Error('Unexpected counts format');
      } catch (err) {
        console.warn('counts/daily failed, falling back to summary', err);
      }

      // 3. Fallback: summary endpoint to get counts_by_date if available
      try {
        const res = await axios.get('/api/search/v1/summary', {
          params: {
            query: query.trim() || '*',
            ...(timeRange !== 'all' && startDate && {
              last_modified_on_or_after: fmt(startDate),
              last_modified_on_or_before: fmt(now),
            }),
          },
        });

        if (res.data && res.data.counts_by_date) {
          const points: ChangePoint[] = Object.entries(res.data.counts_by_date).map(([d, c]) => ({ date: d, count: c as number }));
          setData(points.sort((a,b)=>a.date.localeCompare(b.date)));
          return;
        }
        throw new Error('summary lacks counts_by_date');
      } catch (err) {
        console.warn('summary fallback failed', err);
      }

      // 4. If we reach here, use simulated data
      setApiError('Using simulated data; eCFR API did not return daily counts.');
      setUseMock(true);
      throw new Error('API failed, switching to mock');
      
    } catch (err) {
      console.error("API error:", err);
      
      if (!useMock) {
        setApiError("Using simulated historical data for demonstration. The eCFR API might have limitations for this query.");
        setUseMock(true);
      }
      
      // Generate mock data based on search term
      const now = new Date();
      let limitDate: Date | null = new Date();
      if (timeRange === '1month') {
        limitDate.setMonth(now.getMonth() - 1);
      } else if (timeRange === '6months') {
        limitDate.setMonth(now.getMonth() - 6);
      } else if (timeRange === '1year') {
        limitDate.setFullYear(now.getFullYear() - 1);
      } else if (timeRange === '5years') {
        limitDate.setFullYear(now.getFullYear() - 5);
      }
      
      // Filter data by date
      let filteredData = MOCK_DATA;
      if (timeRange !== 'all' && limitDate) {
        const limitDateStr = limitDate.toISOString().split('T')[0];
        filteredData = MOCK_DATA.filter(item => item.date >= limitDateStr);
      }
      
      // Calculate "relevance" based on query
      const queryRelevance = (query.length / 10) + 
                           (query.toLowerCase().includes('climate') ? 1.5 : 1) *
                           (query.toLowerCase().includes('energy') ? 1.3 : 1) *
                           (query.toLowerCase().includes('regulation') ? 1.4 : 1);
      
      const adjustedData = filteredData.map(point => ({
        ...point,
        count: Math.floor(point.count * queryRelevance)
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
      
      <Box display="flex" flexDirection={{ base: "column", md: "row" }} mb={2} gap={2}>
        <FormControl>
          <FormLabel htmlFor="searchQuery">Search Term</FormLabel>
          <Input 
            id="searchQuery"
            placeholder="Enter search term" 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            onKeyDown={e => e.key==='Enter' && fetchChanges()} 
          />
        </FormControl>
        
        <FormControl>
          <FormLabel htmlFor="timeRange">Time Range</FormLabel>
          <Select 
            id="timeRange"
            value={timeRange} 
            onChange={e => setTimeRange(e.target.value)}
          >
            <option value="1month">Last Month</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
            <option value="5years">Last 5 Years</option>
            <option value="all">All Time</option>
          </Select>
        </FormControl>
        
        <FormControl width={{ base: "100%", md: "auto" }} alignSelf={{ md: "flex-end" }}>
          <Button 
            colorScheme="teal" 
            onClick={fetchChanges} 
            isLoading={loading}
            width={{ base: "100%", md: "auto" }}
            mt={{ base: 2, md: 0 }}
          >
            Search
          </Button>
        </FormControl>
      </Box>
      
      {timeRange === 'all' && (
        <Alert status="warning" variant="subtle" bg="yellow.50" color="gray.700" fontSize="sm" mb={4}>
          <AlertIcon boxSize={4} />
          Note: the eCFR website was created around 2016-17. There may be a surge in data around that time.
        </Alert>
      )}
      
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <Spinner size="xl" />
        </Box>
      ) : error ? (
        <Alert status="info" mb={4}>
          <AlertIcon />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      ) : data.length ? (
        <Box>
          <Text mb={2} fontWeight="medium">Showing {data.length} data points for "{query}"</Text>
          <Text fontWeight="semibold" mb={1}>Historical Term Usage</Text>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 45, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tickFormatter={(tick) => {
                  // Shorten date format for x-axis
                  const date = new Date(tick);
                  return `${date.getMonth()+1}/${date.getFullYear().toString().substr(2,2)}`;
                }}
              >
                <Label value="Date" position="insideBottom" dy={10} />
              </XAxis>
              <YAxis>
                <Label value="Results Count" angle={-90} position="insideLeft" dx={-10} />
              </YAxis>
              <Tooltip 
                formatter={(value) => [`${value} results`, 'Count']} 
                labelFormatter={(label) => `Date: ${label}`} 
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#2C7A7B" 
                name="Results" 
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        <Text>No data available. Try another search term.</Text>
      )}
    </Box>
  );
};

export default HistoricalChanges;
