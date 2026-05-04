const { request } = require('../utils/request')
const { DEFAULT_MARKET, GOLD_API_URL } = require('../config/index')
const { getMetalTrendSamples, pushMetalTrendSample } = require('../utils/storage')
const { getGoldKPrice } = require('../utils/calc')

const OUNCE_TO_GRAM = 31.1034768
const SILVER_API_URL = 'https://api.gold-api.com/price/XAG/CNY'
const PLATINUM_API_URL = 'https://api.gold-api.com/price/XPT/CNY'

function formatGoldPerGramFromOunce(pricePerOunce) {
  return Number(pricePerOunce || 0) / OUNCE_TO_GRAM
}

function buildFallbackTrend(goldPrice) {
  const base = Number(goldPrice || DEFAULT_MARKET.goldPrice)
  return [
    { label: '样本1', value: base * 0.986 },
    { label: '样本2', value: base * 0.992 },
    { label: '样本3', value: base * 0.997 },
    { label: '样本4', value: base * 1.004 },
    { label: '当前', value: base }
  ]
}

function toSampleLabel(updatedAt) {
  const stamp = new Date(updatedAt || Date.now())
  const month = String(stamp.getMonth() + 1).padStart(2, '0')
  const day = String(stamp.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

function buildRangeLabels(rangeType) {
  if (rangeType === 'day') {
    return ['09:30', '10:30', '11:30', '13:30', '14:30', '15:30', '现在']
  }

  if (rangeType === 'week') {
    return ['周一', '周二', '周三', '周四', '周五', '周六', '今日']
  }

  if (rangeType === 'month') {
    return ['第1周', '第2周', '第3周', '第4周', '第5周', '本周']
  }

  return ['第1周', '第2周', '第3周', '第4周', '第5周', '本周']
}

function buildGoldVolatilitySeries(currentPrice, samples, rangeType) {
  const current = Number(currentPrice || DEFAULT_MARKET.goldPrice)
  const sampleValues = (samples || []).map((item) => Number(item.value || 0)).filter(Boolean)
  const fallbackAverage = current * 0.014
  const avgSwing = sampleValues.length > 1
    ? sampleValues.slice(1).reduce((sum, value, index) => sum + Math.abs(value - sampleValues[index]), 0) / (sampleValues.length - 1)
    : fallbackAverage

  const presets = {
    day: [-1.4, -0.8, 0.4, -0.2, 0.7, 1.1, 0],
    week: [-2.8, -1.2, 0.9, -0.6, 1.4, 2.3, 0],
    month: [-5.6, -3.2, -1.5, 1.8, 3.6, 0],
    year: [-13.2, -8.4, -4.1, -1.6, 3.9, 8.2, 0]
  }

  const labels = buildRangeLabels(rangeType)
  const factors = presets[rangeType] || presets.week
  const normalizedSwing = Math.max(
    avgSwing,
    current * (
      rangeType === 'month' ? 0.016 :
      rangeType === 'day' ? 0.005 :
      0.009
    )
  )

  return labels.map((label, index) => ({
    label,
    value: current + normalizedSwing * factors[index]
  }))
}

async function getMarketSnapshot() {
  try {
    const [goldLive, silverLive, platinumLive] = await Promise.all([
      request({ url: GOLD_API_URL }),
      request({ url: SILVER_API_URL }),
      request({ url: PLATINUM_API_URL })
    ])

    const goldPrice = formatGoldPerGramFromOunce(goldLive.price)
    const silverPrice = formatGoldPerGramFromOunce(silverLive.price)
    const platinumPrice = formatGoldPerGramFromOunce(platinumLive.price)

    const goldSamples = pushMetalTrendSample('XAU', {
      label: toSampleLabel(goldLive.updatedAt),
      value: goldPrice
    })
    const silverSamples = pushMetalTrendSample('XAG', {
      label: toSampleLabel(silverLive.updatedAt),
      value: silverPrice
    })
    const platinumSamples = pushMetalTrendSample('XPT', {
      label: toSampleLabel(platinumLive.updatedAt),
      value: platinumPrice
    })

    const goldTrend = goldSamples.length ? goldSamples : buildFallbackTrend(goldPrice)
    const prevGold = goldTrend.length > 1 ? Number(goldTrend[goldTrend.length - 2].value || 0) : goldPrice
    const goldChange = prevGold ? ((goldPrice - prevGold) / prevGold) * 100 : 0
    const prevSilver = silverSamples.length > 1 ? Number(silverSamples[silverSamples.length - 2].value || 0) : silverPrice
    const silverChange = prevSilver ? ((silverPrice - prevSilver) / prevSilver) * 100 : 0
    const prevPlatinum = platinumSamples.length > 1 ? Number(platinumSamples[platinumSamples.length - 2].value || 0) : platinumPrice
    const platinumChange = prevPlatinum ? ((platinumPrice - prevPlatinum) / prevPlatinum) * 100 : 0

    return {
      success: true,
      data: {
        goldPrice,
        silverPrice,
        platinumPrice,
        diamondPrice: DEFAULT_MARKET.diamondPrice,
        updatedAt: goldLive.updatedAt,
        goldTrend,
        diamondTrend: [
          { label: '周一', value: 9600 },
          { label: '周二', value: 9680 },
          { label: '周三', value: 9750 },
          { label: '周四', value: 9710 },
          { label: '周五', value: 9800 }
        ],
        goldChange,
        metalPrices: {
          gold24k: goldPrice,
          gold22k: getGoldKPrice(goldPrice, 91.6),
          gold18k: getGoldKPrice(goldPrice, 75.0),
          gold14k: getGoldKPrice(goldPrice, 58.5),
          gold9k: getGoldKPrice(goldPrice, 37.5),
          platinum: platinumPrice,
          silver: silverPrice
        },
        metalChanges: {
          gold24k: goldChange,
          gold22k: goldChange,
          gold18k: goldChange,
          gold14k: goldChange,
          gold9k: goldChange,
          platinum: platinumChange,
          silver: silverChange
        },
        metalVolatility: {
          gold24k: {
            day: buildGoldVolatilitySeries(goldPrice, goldSamples, 'day'),
            week: buildGoldVolatilitySeries(goldPrice, goldSamples, 'week'),
            month: buildGoldVolatilitySeries(goldPrice, goldSamples, 'month')
          },
          gold22k: {
            day: buildGoldVolatilitySeries(getGoldKPrice(goldPrice, 91.6), goldSamples.map((item) => ({ ...item, value: getGoldKPrice(item.value, 91.6) })), 'day'),
            week: buildGoldVolatilitySeries(getGoldKPrice(goldPrice, 91.6), goldSamples.map((item) => ({ ...item, value: getGoldKPrice(item.value, 91.6) })), 'week'),
            month: buildGoldVolatilitySeries(getGoldKPrice(goldPrice, 91.6), goldSamples.map((item) => ({ ...item, value: getGoldKPrice(item.value, 91.6) })), 'month')
          },
          gold18k: {
            day: buildGoldVolatilitySeries(getGoldKPrice(goldPrice, 75.0), goldSamples.map((item) => ({ ...item, value: getGoldKPrice(item.value, 75.0) })), 'day'),
            week: buildGoldVolatilitySeries(getGoldKPrice(goldPrice, 75.0), goldSamples.map((item) => ({ ...item, value: getGoldKPrice(item.value, 75.0) })), 'week'),
            month: buildGoldVolatilitySeries(getGoldKPrice(goldPrice, 75.0), goldSamples.map((item) => ({ ...item, value: getGoldKPrice(item.value, 75.0) })), 'month')
          },
          gold14k: {
            day: buildGoldVolatilitySeries(getGoldKPrice(goldPrice, 58.5), goldSamples.map((item) => ({ ...item, value: getGoldKPrice(item.value, 58.5) })), 'day'),
            week: buildGoldVolatilitySeries(getGoldKPrice(goldPrice, 58.5), goldSamples.map((item) => ({ ...item, value: getGoldKPrice(item.value, 58.5) })), 'week'),
            month: buildGoldVolatilitySeries(getGoldKPrice(goldPrice, 58.5), goldSamples.map((item) => ({ ...item, value: getGoldKPrice(item.value, 58.5) })), 'month')
          },
          gold9k: {
            day: buildGoldVolatilitySeries(getGoldKPrice(goldPrice, 37.5), goldSamples.map((item) => ({ ...item, value: getGoldKPrice(item.value, 37.5) })), 'day'),
            week: buildGoldVolatilitySeries(getGoldKPrice(goldPrice, 37.5), goldSamples.map((item) => ({ ...item, value: getGoldKPrice(item.value, 37.5) })), 'week'),
            month: buildGoldVolatilitySeries(getGoldKPrice(goldPrice, 37.5), goldSamples.map((item) => ({ ...item, value: getGoldKPrice(item.value, 37.5) })), 'month')
          },
          platinum: {
            day: buildGoldVolatilitySeries(platinumPrice, platinumSamples, 'day'),
            week: buildGoldVolatilitySeries(platinumPrice, platinumSamples, 'week'),
            month: buildGoldVolatilitySeries(platinumPrice, platinumSamples, 'month')
          },
          silver: {
            day: buildGoldVolatilitySeries(silverPrice, silverSamples, 'day'),
            week: buildGoldVolatilitySeries(silverPrice, silverSamples, 'week'),
            month: buildGoldVolatilitySeries(silverPrice, silverSamples, 'month')
          }
        },
        diamondChange: -0.6,
        source: {
          goldCurrent: 'gold-api.com',
          goldHistory: 'local_samples',
          diamond: 'mock'
        }
      }
    }
  } catch (error) {
    return {
      success: true,
      data: {
        ...DEFAULT_MARKET,
        goldTrend: getMetalTrendSamples('XAU').length ? getMetalTrendSamples('XAU') : buildFallbackTrend(DEFAULT_MARKET.goldPrice),
        diamondTrend: [
          { label: '周一', value: 9600 },
          { label: '周二', value: 9680 },
          { label: '周三', value: 9750 },
          { label: '周四', value: 9710 },
          { label: '周五', value: 9800 }
        ],
        goldChange: 1.8,
        metalPrices: {
          gold24k: DEFAULT_MARKET.goldPrice,
          gold22k: getGoldKPrice(DEFAULT_MARKET.goldPrice, 91.6),
          gold18k: getGoldKPrice(DEFAULT_MARKET.goldPrice, 75.0),
          gold14k: getGoldKPrice(DEFAULT_MARKET.goldPrice, 58.5),
          gold9k: getGoldKPrice(DEFAULT_MARKET.goldPrice, 37.5),
          platinum: 430,
          silver: 15.8
        },
        metalChanges: {
          gold24k: 1.8,
          gold22k: 1.8,
          gold18k: 1.8,
          gold14k: 1.8,
          gold9k: 1.8,
          platinum: 0.9,
          silver: -0.4
        },
        metalVolatility: {
          gold24k: {
            day: buildGoldVolatilitySeries(DEFAULT_MARKET.goldPrice, getMetalTrendSamples('XAU'), 'day'),
            week: buildGoldVolatilitySeries(DEFAULT_MARKET.goldPrice, getMetalTrendSamples('XAU'), 'week'),
            month: buildGoldVolatilitySeries(DEFAULT_MARKET.goldPrice, getMetalTrendSamples('XAU'), 'month')
          },
          gold22k: {
            day: buildGoldVolatilitySeries(getGoldKPrice(DEFAULT_MARKET.goldPrice, 91.6), [], 'day'),
            week: buildGoldVolatilitySeries(getGoldKPrice(DEFAULT_MARKET.goldPrice, 91.6), [], 'week'),
            month: buildGoldVolatilitySeries(getGoldKPrice(DEFAULT_MARKET.goldPrice, 91.6), [], 'month')
          },
          gold18k: {
            day: buildGoldVolatilitySeries(getGoldKPrice(DEFAULT_MARKET.goldPrice, 75.0), [], 'day'),
            week: buildGoldVolatilitySeries(getGoldKPrice(DEFAULT_MARKET.goldPrice, 75.0), [], 'week'),
            month: buildGoldVolatilitySeries(getGoldKPrice(DEFAULT_MARKET.goldPrice, 75.0), [], 'month')
          },
          gold14k: {
            day: buildGoldVolatilitySeries(getGoldKPrice(DEFAULT_MARKET.goldPrice, 58.5), [], 'day'),
            week: buildGoldVolatilitySeries(getGoldKPrice(DEFAULT_MARKET.goldPrice, 58.5), [], 'week'),
            month: buildGoldVolatilitySeries(getGoldKPrice(DEFAULT_MARKET.goldPrice, 58.5), [], 'month')
          },
          gold9k: {
            day: buildGoldVolatilitySeries(getGoldKPrice(DEFAULT_MARKET.goldPrice, 37.5), [], 'day'),
            week: buildGoldVolatilitySeries(getGoldKPrice(DEFAULT_MARKET.goldPrice, 37.5), [], 'week'),
            month: buildGoldVolatilitySeries(getGoldKPrice(DEFAULT_MARKET.goldPrice, 37.5), [], 'month')
          },
          platinum: {
            day: buildGoldVolatilitySeries(430, getMetalTrendSamples('XPT'), 'day'),
            week: buildGoldVolatilitySeries(430, getMetalTrendSamples('XPT'), 'week'),
            month: buildGoldVolatilitySeries(430, getMetalTrendSamples('XPT'), 'month')
          },
          silver: {
            day: buildGoldVolatilitySeries(15.8, getMetalTrendSamples('XAG'), 'day'),
            week: buildGoldVolatilitySeries(15.8, getMetalTrendSamples('XAG'), 'week'),
            month: buildGoldVolatilitySeries(15.8, getMetalTrendSamples('XAG'), 'month')
          }
        },
        diamondChange: -0.6,
        source: {
          goldCurrent: 'fallback',
          goldHistory: getMetalTrendSamples('XAU').length ? 'local_samples' : 'fallback',
          diamond: 'mock'
        },
        requestError: error.message || 'gold_api_failed'
      }
    }
  }
}

function fetchRemoteMarketSnapshot() {
  return request({
    url: '/market/snapshot'
  })
}

module.exports = {
  getMarketSnapshot,
  fetchRemoteMarketSnapshot
}
