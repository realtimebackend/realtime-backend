const axios = require('axios');

const base = process.env.NOCO_BASE_URL;
const table = process.env.NOCO_TABLE;
const viewId = process.env.NOCO_VIEW_ID;
const token = process.env.NOCO_API_KEY;

const url = `${base}/api/v2/tables/${table}/records`;
const FAST_API_URL = 'https://fastapi.qurvii.com/scan';

// Single page fetcher
async function fetchPage(offset = 0, limit = 1000, today) {
  const res = await axios.get(url, {
    params: {
      offset,
      limit,
      viewId,
      where: `(scanned_timestamp,eq,exactDate,${today})`,
    },
    headers: {
      'xc-token': token,
    },
  });

  return res.data;
}

async function fetchAll() {
  const today = new Date().toISOString().split('T')[0]; // 🔥 NOW dynamic

  let limit = 1000;

  // Step 1: Fetch first page
  const first = await fetchPage(0, limit, today);
  let total = first.pageInfo?.totalRows || first.list?.length || 0;

  console.log('Total Records:', total);

  let allData = [...first.list];

  // Step 2: generate offsets
  let tasks = [];
  for (let offset = limit; offset < total; offset += limit) {
    tasks.push(fetchPage(offset, limit, today));
  }

  // Step 3: run in parallel
  const results = await Promise.all(tasks);

  // Step 4: merge data
  for (const r of results) {
    allData.push(...r.list);
  }

  console.log('Fetched:', allData.length);

  return allData;
}

async function scanRecord(payload) {
  try {
    const response = await axios.post(FAST_API_URL, payload);
    const data = response.data;
    return data;
  } catch (error) {
    throw new Error('Failed to scan record error ', error.message || 'Internal Error');
  }
}

module.exports = {
  getRecords: fetchAll,
  scanRecord,
};
