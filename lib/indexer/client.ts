import { indexer } from '@/config';

/**
 * Response structure from Conduit Indexer
 */
export interface IndexerResponse<T = any> {
  data: T[];
  meta?: {
    total?: number;
    page?: number;
  };
}

/**
 * Detect if running on server-side
 */
const isServer = typeof window === 'undefined';

/**
 * Query the Conduit Indexer API
 *
 * SERVER-SIDE: Calls Conduit API directly with API key from env
 * CLIENT-SIDE: Should never be called - use Server Actions instead
 *
 * @param query - SQL query string
 * @param signatures - Array of event signatures to query
 * @returns Promise with query results
 *
 * @example
 * ```typescript
 * // Server-side only (in Server Actions or Server Components)
 * const result = await queryIndexer(
 *   "SELECT * FROM logs WHERE chain = 78651",
 *   ['OperatorRegistered(address indexed operator, string metadataURI)']
 * );
 * ```
 */
export async function queryIndexer<T = any>(
  query: string,
  signatures: string[]
): Promise<IndexerResponse<T>> {
  if (!isServer) {
    throw new Error(
      'queryIndexer() can only be called server-side. Use Server Actions from lib/indexer/actions.ts instead.'
    );
  }

  // Get API key from environment (server-side only)
  const apiKey = process.env.INDEXER_API_KEY;
  if (!apiKey) {
    throw new Error('INDEXER_API_KEY environment variable not configured');
  }

  // Build request to Conduit Indexer API
  const indexerUrl =
    process.env.INDEXER_API_URL || 'https://indexing.conduit.xyz/v2/query';

  const params = new URLSearchParams({
    'api-key': apiKey,
    query,
  });

  // Add each signature as a separate parameter
  signatures.forEach((sig) => {
    params.append('signatures', sig);
  });

  const url = `${indexerUrl}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Indexer query failed (${response.status}): ${errorText}`
      );
    }

    const data = await response.json();

    // Conduit returns data as array: [{ columns: [...], rows: [[...]] }]
    // Or single object: { columns: [...], rows: [[...]] }
    // Transform rows (array of arrays) into objects using column names

    const dataArray = Array.isArray(data) ? data : [data];
    const allTransformedRows: any[] = [];

    dataArray.forEach((item) => {
      if (item && item.columns && item.rows) {
        const columnNames = item.columns.map((col: any) => col.name);
        const transformedRows = item.rows.map((row: any[]) => {
          const obj: any = {};
          columnNames.forEach((name: string, index: number) => {
            obj[name] = row[index];
          });
          return obj;
        });
        allTransformedRows.push(...transformedRows);
      }
    });

    return {
      data: allTransformedRows, // Always return transformed rows (empty array if no results)
    };
  } catch (error) {
    console.error('Indexer query error:', error);
    throw error;
  }
}

/**
 * Test the indexer connection (server-side only)
 */
export async function testIndexerConnection(): Promise<boolean> {
  if (!isServer) {
    throw new Error('testIndexerConnection() can only be called server-side');
  }

  try {
    // Simple query to test connection
    const result = await queryIndexer(
      `SELECT block_num FROM logs WHERE chain = ${indexer.chainId} LIMIT 1`,
      []
    );
    return result.data.length > 0;
  } catch (error) {
    console.error('Indexer connection test failed:', error);
    return false;
  }
}
