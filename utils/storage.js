const { STORAGE_KEYS } = require('../config/index')

function getCalcHistory() {
  return wx.getStorageSync(STORAGE_KEYS.CALC_HISTORY) || []
}

function pushCalcHistory(record) {
  const history = getCalcHistory()
  const next = [record].concat(history).slice(0, 20)
  wx.setStorageSync(STORAGE_KEYS.CALC_HISTORY, next)
  return next
}

function clearCalcHistory() {
  wx.setStorageSync(STORAGE_KEYS.CALC_HISTORY, [])
  return []
}

function getAssetLedger() {
  return wx.getStorageSync(STORAGE_KEYS.ASSET_LEDGER) || []
}

function appendAsset(asset) {
  const ledger = getAssetLedger()
  const next = [asset].concat(ledger)
  wx.setStorageSync(STORAGE_KEYS.ASSET_LEDGER, next)
  return next
}

function getMetalTrendSamples(symbol) {
  return wx.getStorageSync(`${STORAGE_KEYS.METAL_TREND_PREFIX}${symbol}`) || []
}

function pushMetalTrendSample(symbol, sample) {
  const samples = getMetalTrendSamples(symbol)
  const deduped = samples.filter((item) => item.label !== sample.label)
  const next = deduped.concat(sample).slice(-7)
  wx.setStorageSync(`${STORAGE_KEYS.METAL_TREND_PREFIX}${symbol}`, next)
  return next
}

function saveAssetLedger(list) {
  wx.setStorageSync(STORAGE_KEYS.ASSET_LEDGER, list)
  return list
}

function updateAsset(assetId, patch) {
  const ledger = getAssetLedger()
  const next = ledger.map((item) => (item.id === assetId ? { ...item, ...patch } : item))
  return saveAssetLedger(next)
}

function deleteAsset(assetId) {
  const ledger = getAssetLedger()
  const next = ledger.filter((item) => item.id !== assetId)
  return saveAssetLedger(next)
}

module.exports = {
  getCalcHistory,
  pushCalcHistory,
  clearCalcHistory,
  getAssetLedger,
  appendAsset,
  getMetalTrendSamples,
  pushMetalTrendSample,
  saveAssetLedger,
  updateAsset,
  deleteAsset
}
