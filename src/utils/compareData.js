module.exports = function detectNew(oldData = [], newData = []) {
  const oldIds = new Set(oldData.map(i => i.system_id));
  return newData.filter(row => !oldIds.has(row.system_id));
};
