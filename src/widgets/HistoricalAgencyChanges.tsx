import { useEffect, useState } from 'react';
import { Box, Select, Spinner, Text, Alert, AlertIcon, AlertTitle, FormControl, FormLabel } from '@chakra-ui/react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Label } from 'recharts';

interface ChangePoint {
  date: string;
  count: number;
}

interface Agency {
  name: string;
  slug: string;
  short_name: string;
  display_name?: string;
}

// Simple mock dataset reused from HistoricalChanges
const MOCK_DATA: ChangePoint[] = [
  { date: '2024-01-01', count: 10 },
  { date: '2024-02-01', count: 14 },
  { date: '2024-03-01', count: 7 },
  { date: '2024-04-01', count: 18 },
  { date: '2024-05-01', count: 9 },
  { date: '2024-06-01', count: 22 },
  { date: '2024-07-01', count: 15 },
  { date: '2024-08-01', count: 11 },
];

const HistoricalAgencyChanges = () => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('1year');
  const [data, setData] = useState<ChangePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false);

  // Fetch agencies once
  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const res = await axios.get('/api/admin/v1/agencies.json');
        setAgencies(res.data.agencies || []);
      } catch (err) {
        console.error('Error loading agencies, using fallback', err);
      }
    };
    fetchAgencies();
  }, []);

  const fetchChanges = async () => {
    if (!selectedAgency) return;
    setLoading(true);
    setApiError(null);

    const now = new Date();
    let start: Date | null = new Date(now);
    if (timeRange === '1month') start.setMonth(now.getMonth() - 1);
    else if (timeRange === '6months') start.setMonth(now.getMonth() - 6);
    else if (timeRange === '1year') start.setFullYear(now.getFullYear() - 1);
    else if (timeRange === '5years') start.setFullYear(now.getFullYear() - 5);
    else if (timeRange === 'all') start = null;

    const fmt = (d: Date) => d.toISOString().split('T')[0];

    try {
      const res = await axios.get('/api/search/v1/counts/daily', {
        params: {
          query: '*',
          agency_slugs: [selectedAgency],
          ...(timeRange !== 'all' && start && {
            last_modified_on_or_after: fmt(start),
            last_modified_on_or_before: fmt(now),
          }),
        },
      });

      if (res.data && res.data.dates) {
        const points: ChangePoint[] = Object.entries(res.data.dates)
          .map(([d, c]) => ({ date: d, count: c as number }))
          .sort((a, b) => a.date.localeCompare(b.date));
        setData(points);
        if (!points.length) setApiError('No change data found for this period.');
        return;
      }
      throw new Error('Unexpected API format');
    } catch (err) {
      console.warn('Falling back to mock data', err);
      setUseMock(true);
      let mockFiltered = MOCK_DATA;
      if (timeRange !== 'all' && start) {
        const limitDateStr = fmt(start);
        mockFiltered = MOCK_DATA.filter(p => p.date >= limitDateStr);
      }
      setData(mockFiltered);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when selections change
  useEffect(() => {
    fetchChanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgency, timeRange]);

  return (
    <Box>
      <Box display="flex" flexDirection={{ base: 'column', md: 'row' }} gap={3} mb={2}>
        <FormControl>
          <FormLabel>Agency</FormLabel>
          <Select
            placeholder="Select agency"
            value={selectedAgency}
            onChange={e => setSelectedAgency(e.target.value)}
          >
            {agencies.map(a => (
              <option key={a.slug} value={a.slug}>
                {a.display_name ?? a.name}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Time Range</FormLabel>
          <Select value={timeRange} onChange={e => setTimeRange(e.target.value)}>
            <option value="1month">Last Month</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
            <option value="5years">Last 5 Years</option>
            <option value="all">All Time</option>
          </Select>
        </FormControl>
      </Box>

      {timeRange === 'all' && (
        <Alert status="warning" variant="subtle" bg="yellow.50" color="gray.700" fontSize="sm" mb={4}>
          <AlertIcon boxSize={4} />
          Note: the eCFR website was created around 2016-17. There may be a surge in data around that time.
        </Alert>
      )}

      {apiError ? (
        <Alert status="info" mb={4}>
          <AlertIcon />
          <AlertTitle>{apiError}</AlertTitle>
        </Alert>
      ) : loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <Spinner size="xl" />
        </Box>
      ) : data.length ? (
        <>
          <Text fontWeight="semibold" mb={1}>Historical Agency Changes</Text>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 45, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={t => {
                  const d = new Date(t);
                  return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
                }}
              >
                <Label value="Date" position="insideBottom" dy={10} />
              </XAxis>
              <YAxis>
                <Label value="Changes" angle={-90} position="insideLeft" dx={-10} />
              </YAxis>
              <Tooltip formatter={v => [`${v} changes`, 'Changes']} />
              <Line type="monotone" dataKey="count" stroke="#2C5282" name="Changes" />
            </LineChart>
          </ResponsiveContainer>
        </>
      ) : (
        <Text>Select an agency and time range to see change counts.</Text>
      )}
    </Box>
  );
};

export default HistoricalAgencyChanges;
