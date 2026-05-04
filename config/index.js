const BASE_URL = 'https://example.com/mock'
const GOLD_API_URL = 'https://api.gold-api.com/price/XAU/CNY'

const STORAGE_KEYS = {
  CALC_HISTORY: 'gold_diamond_calc_history',
  ASSET_LEDGER: 'gold_diamond_asset_ledger',
  METAL_TREND_PREFIX: 'metal_trend_samples_'
}

const DEFAULT_MARKET = {
  goldPrice: 728,
  diamondPrice: 9800,
  updatedAt: '2026-05-04 23:20'
}

module.exports = {
  BASE_URL,
  GOLD_API_URL,
  STORAGE_KEYS,
  DEFAULT_MARKET
}
