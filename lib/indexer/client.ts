import { indexer } from '@/config';

/**
 * Base URL for indexer API routes
 * All queries go through our server-side proxy to keep API key secure
 */
const INDEXER_API_BASE = '/api/indexer';

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
 * Query the Conduit Indexer API via our server-side proxy
 * This keeps the API key secure on the server
 *
 * @param query - SQL query string
 * @param signatures - Array of event signatures to query
 * @returns Promise with query results
 *
 * @example
 * ```typescript
 * const result = await queryIndexer(
 *   "SELECT * FROM operator_registered WHERE operator = '0x...' AND chain = 78651",
 *   ['OperatorRegistered(address indexed operator, string metadataURI)']
 * );
 * ```
 */
export async function queryIndexer<T = any>(
  query: string,
  signatures: string[]
): Promise<IndexerResponse<T>> {
  // Build URL with query parameters - call our API route instead of Conduit directly
  const params = new URLSearchParams({
    query,
  });

  // Add each signature as a separate parameter
  signatures.forEach((sig) => {
    params.append('signatures', sig);
  });

  const url = `${INDEXER_API_BASE}?${params.toString()}`;

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
 * Test the indexer connection
 */
export async function testIndexerConnection(): Promise<boolean> {
  try {
    // Simple query to test connection
    const result = await queryIndexer(
      `SELECT block_number FROM logs WHERE chain = ${indexer.chainId} LIMIT 1`,
      []
    );
    return result.data.length > 0;
  } catch (error) {
    console.error('Indexer connection test failed:', error);
    return false;
  }
}
