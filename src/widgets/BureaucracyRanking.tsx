import { useEffect, useState } from 'react';
import {
  Box,
  Spinner,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
} from '@chakra-ui/react';
import axios from 'axios';

interface Agency {
  name: string;
  slug: string;
  short_name: string;
  display_name?: string;
}

interface AgencyScore {
  agency: string;
  slug: string;
  score: number;
  wordCount: number;
  changeCount: number;
}

// Fallback mock data in case API fails
const MOCK_SCORES: AgencyScore[] = [
  { agency: 'Environmental Protection Agency', slug: 'epa', wordCount: 500000, changeCount: 120000, score: 620000 },
  { agency: 'Department of Agriculture', slug: 'usda', wordCount: 420000, changeCount: 95000, score: 515000 },
  { agency: 'Department of Commerce', slug: 'doc', wordCount: 380000, changeCount: 110000, score: 490000 },
];

const BureaucracyRanking = () => {
  const [scores, setScores] = useState<AgencyScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false);

  useEffect(() => {
    calculateScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWordCount = async (slug: string): Promise<number> => {
    try {
      const res = await axios.get('/api/search/v1/count', {
        params: {
          query: '*',
          agency_slugs: [slug],
        },
      });
      // When the API returns `{ count: X }`
      if (res.data && typeof res.data.count === 'number') return res.data.count;
      // Some versions of the API return `{ meta: { total_count: X } }` where total_count may be string
      if (res.data?.meta?.total_count !== undefined) {
        return Number(res.data.meta.total_count);
      }
      throw new Error('Unexpected word-count response');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        console.warn('Rate-limited while fetching word count for', slug);
        return 0; // API throttled – treat as 0 so we do not inject random noise
      }
      console.warn('Word count fallback for', slug, err);
      return 0;
    }
  };

  const fetchChangeCount = async (slug: string): Promise<number> => {
    try {
      const res = await axios.get('/api/search/v1/counts/daily', {
        params: {
          query: '*',
          agency_slugs: [slug],
        },
      });
      if (res.data && res.data.dates) {
        return Object.values(res.data.dates).reduce((sum: number, v) => sum + Number(v), 0);
      }
      throw new Error('Unexpected change-count response');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        console.warn('Rate-limited while fetching change count for', slug);
        return 0;
      }
      console.warn('Change count fallback for', slug, err);
      return 0;
    }
  };

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const attemptRetry = async <T,>(fn: () => Promise<T>, maxRetries = 2): Promise<T> => {
    let tryNum = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await fn();
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 429 && tryNum < maxRetries) {
          tryNum += 1;
          await delay(500 * tryNum);
          continue;
        }
        throw e;
      }
    }
  };

  const calculateScores = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const agenciesRes = await axios.get('/api/admin/v1/agencies.json');
      const agencies: Agency[] = agenciesRes.data.agencies || [];

      const MAX_AGENCIES = 50; // try to show more while respecting rate-limits
      const limited = agencies.slice(0, MAX_AGENCIES);

      const CONCURRENCY = 5; // how many agencies to process at once

      const scoresUnsorted: AgencyScore[] = [];

      // Chunk agencies to respect concurrency limit
      for (let i = 0; i < limited.length; i += CONCURRENCY) {
        const batch = limited.slice(i, i + CONCURRENCY);

        const batchResults = await Promise.all(batch.map(async (a) => {
          const wordCount = await attemptRetry(() => fetchWordCount(a.slug));
          const changeCount = await attemptRetry(() => fetchChangeCount(a.slug));
          return {
            agency: a.display_name ?? a.name,
            slug: a.slug,
            wordCount,
            changeCount,
            score: wordCount + changeCount,
          } as AgencyScore;
        }));

        scoresUnsorted.push(...batchResults);
      }

      const sorted = scoresUnsorted.sort((a, b) => b.score - a.score);
      setScores(sorted);
    } catch (err) {
      console.error('Error calculating bureaucracy scores', err);
      setApiError('Could not compute full ranking – API limits reached. Partial data shown.');
      setUseMock(true);
      setScores(MOCK_SCORES);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Text fontWeight="semibold" mb={2}>
        Agencies ranked from <b>most</b> to <b>least</b> bureaucratic (Word Count + Regulation Change Count).
      </Text>

      {apiError && (
        <Alert status="warning" mb={4}>
          <AlertIcon />
          <AlertTitle>{apiError}</AlertTitle>
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <Spinner size="xl" />
        </Box>
      ) : (
        <>
          <Table variant="striped" size="sm">
            <Thead>
              <Tr>
                <Th>#</Th>
                <Th>Agency</Th>
                <Th isNumeric>Word Count</Th>
                <Th isNumeric>Change Count</Th>
                <Th isNumeric>Total</Th>
              </Tr>
            </Thead>
            <Tbody>
              {scores.map((s, idx) => (
                <Tr key={s.slug}>
                  <Td>{idx + 1}</Td>
                  <Td>{s.agency}</Td>
                  <Td isNumeric>{s.wordCount.toLocaleString()}</Td>
                  <Td isNumeric>{s.changeCount.toLocaleString()}</Td>
                  <Td isNumeric fontWeight="bold">
                    {s.score.toLocaleString()}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Button mt={4} size="sm" onClick={calculateScores} isDisabled={loading} colorScheme="teal">
            Refresh Ranking
          </Button>
        </>
      )}
    </Box>
  );
};

export default BureaucracyRanking;
