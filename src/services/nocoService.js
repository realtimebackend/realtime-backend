const axios = require('axios');

const base = process.env.NOCO_BASE_URL;
const table = process.env.NOCO_TABLE;
const viewId = process.env.NOCO_VIEW_ID;
const token = process.env.NOCO_API_KEY;

const url = `${base}/api/v2/tables/${table}/records`;
const FAST_API_URL = 'https://fastapi.qurvii.com';

// Single page fetcher with optional date filter
async function fetchPage(offset = 0, limit = 1000, dateFilter = null) {
  const params = {
    offset,
    limit,
    viewId,
  };

  // Add where clause only if dateFilter is provided
  if (dateFilter) {
    params.where = dateFilter;
  }

  const res = await axios.get(url, {
    params,
    headers: {
      'xc-token': token,
    },
  });

  return res.data;
}

// Build date filter condition using NocoDB's gt/lt with ~and
function buildDateFilter(date, endDate = null) {
  if (!date) return null;

  // If endDate is provided, create a range filter using gt and lt with ~and
  if (endDate) {
    // Ensure dates are in proper format
    const startDate = new Date(date).toISOString().split('T')[0];
    const endDateFormatted = new Date(endDate).toISOString().split('T')[0];

    // NocoDB syntax: (field,gt,exactDate,startDate)~and(field,lt,exactDate,endDate)
    return `(scanned_timestamp,gt,exactDate,${startDate})~and(scanned_timestamp,lt,exactDate,${endDateFormatted})`;
  }

  // Single date filter (exact match) - backward compatible
  return `(scanned_timestamp,eq,exactDate,${date})`;
}

async function fetchAll(date = null, endDate = null) {
  // If no date provided, use today's date (backward compatible)
  const today = new Date().toISOString().split('T')[0];
  const startDate = date || today;

  // Build the where clause
  const dateFilter = buildDateFilter(startDate, endDate);

  let limit = 1000;

  // Step 1: Fetch first page with date filter
  const first = await fetchPage(0, limit, dateFilter);
  let total = first.pageInfo?.totalRows || first.list?.length || 0;

  console.log('Total Records:', total);
  console.log('Date Filter:', dateFilter || 'No date filter');

  let allData = [...first.list];

  // Step 2: generate offsets for remaining pages
  let tasks = [];
  for (let offset = limit; offset < total; offset += limit) {
    tasks.push(fetchPage(offset, limit, dateFilter));
  }

  // Step 3: run in parallel
  if (tasks.length > 0) {
    const results = await Promise.all(tasks);
    // Step 4: merge data
    for (const r of results) {
      allData.push(...r.list);
    }
  }

  console.log('Fetched:', allData.length);

  return allData;
}

async function scanRecord(payload) {
  try {
    const response = await axios.post(`${FAST_API_URL}/scan`, payload);
    const data = response.data;
    return data;
  } catch (error) {
    throw new Error('Failed to scan record error ' + (error.message || 'Internal Error'));
  }
}

async function getUsers() {
  try {
    const response = await axios.get(`${FAST_API_URL}/getUsers`);
    const data = response.data;
    return data;
  } catch (error) {
    throw new Error('Failed to fetch employee records', +(error.message || 'Internal Error'));
  }
}

module.exports = {
  getRecords: fetchAll,
  scanRecord,
  fetchAll,
  fetchPage,
  buildDateFilter,
  getUsers,
};
