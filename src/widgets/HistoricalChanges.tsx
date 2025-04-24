import { useEffect, useState } from 'react';
import { Box, Input, Spinner, Text } from '@chakra-ui/react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ChangePoint {
  date: string;
  count: number;
}

const API_BASE = 'https://www.ecfr.gov';

const HistoricalChanges = () => {
  const [query, setQuery] = useState('climate');
  const [data, setData] = useState<ChangePoint[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChanges = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/search/v1/counts/daily`, {
        params: {
          query,
          per_page: 1000,
        },
      });
      // Expect res.data.counts array with {date,count}, maybe transform
      const points: ChangePoint[] = (res.data.counts || []).map((c: any) => ({
        date: c.date,
        count: c.count,
      }));
      setData(points);
    } catch (err) {
      console.error(err);
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
      <Input mb={4} placeholder="Search term" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==='Enter' && fetchChanges()} />
      {loading ? (
        <Spinner />
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
        <Text>No data available.</Text>
      )}
    </Box>
  );
};

export default HistoricalChanges;
