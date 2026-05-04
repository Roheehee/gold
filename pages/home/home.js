const { getMarketSnapshot } = require('../../api/market')
const { calcGoldEstimate, calcDiamondEstimate, getGoldKPrice } = require('../../utils/calc')
const { formatPrice, formatDate } = require('../../utils/format')
const { pushCalcHistory, appendAsset } = require('../../utils/storage')

Page({
  data: {
    loading: true,
    calculatorTabs: [
      { key: 'gold', label: '黄金估值' },
      { key: 'diamond', label: '钻石估值' },
      { key: 'combo', label: '钻石+贵金属' }
    ],
    currentTab: 'gold',
    goldKOptions: [
      { label: '9K', purity: 37.5 },
      { label: '14K', purity: 58.5 },
      { label: '18K', purity: 75.0 },
      { label: '22K', purity: 91.6 },
      { label: '24K', purity: 99.9 }
    ],
    goldWeight: '10',
    goldKIndex: 4,
    comboMetalWeight: '10',
    comboMetalIndex: 0,
    comboMetalOptions: [
      { label: '黄金24K', key: 'gold24k' },
      { label: '黄金22K', key: 'gold22k' },
      { label: '黄金18K', key: 'gold18k' },
      { label: '黄金14K', key: 'gold14k' },
      { label: '黄金9K', key: 'gold9k' },
      { label: '铂金', key: 'platinum' },
      { label: '银', key: 'silver' }
    ],
    diamondCarat: '1.0',
    diamondColorIndex: 2,
    diamondClarityIndex: 3,
    diamondCutIndex: 1,
    diamondColorOptions: [
      { label: 'D 色', value: 'D', factor: 1.18 },
      { label: 'E 色', value: 'E', factor: 1.12 },
      { label: 'F 色', value: 'F', factor: 1.08 },
      { label: 'G 色', value: 'G', factor: 1.0 },
      { label: 'H 色', value: 'H', factor: 0.93 },
      { label: 'I 色', value: 'I', factor: 0.86 },
      { label: 'J 色', value: 'J', factor: 0.79 }
    ],
    diamondClarityOptions: [
      { label: 'IF', value: 'IF', factor: 1.2 },
      { label: 'VVS1', value: 'VVS1', factor: 1.12 },
      { label: 'VVS2', value: 'VVS2', factor: 1.06 },
      { label: 'VS1', value: 'VS1', factor: 1.0 },
      { label: 'VS2', value: 'VS2', factor: 0.94 },
      { label: 'SI1', value: 'SI1', factor: 0.84 },
      { label: 'SI2', value: 'SI2', factor: 0.74 }
    ],
    diamondCutOptions: [
      { label: 'EX', value: 'EX', factor: 1.08 },
      { label: 'VG', value: 'VG', factor: 1.0 },
      { label: 'G', value: 'G', factor: 0.9 }
    ],
    market: {
      goldPrice24k: '0.00',
      metalPrices: {},
      updatedAt: '--'
    },
    goldEstimatedValue: '0.00',
    goldRecordLabel: '',
    goldResultDescription: '',
    diamondEstimatedValue: '0.00',
    diamondRecycleRange: '0.00 - 0.00',
    diamondRecordLabel: '',
    diamondResultDescription: '',
    comboEstimatedValue: '0.00',
    comboRecycleRange: '0.00 - 0.00',
    comboRecordLabel: '',
    comboResultDescription: ''
  },

  onLoad() {
    this.bootstrap()
  },

  async bootstrap() {
    const response = await getMarketSnapshot()
    const market = response.data

    this.setData({
      loading: false,
      market: {
        goldPrice24k: formatPrice(market.goldPrice),
        metalPrices: market.metalPrices || {},
        updatedAt: market.updatedAt
      }
    })

    this.calculateValue()
  },

  handleTabChange(event) {
    this.setData({
      currentTab: event.currentTarget.dataset.tab
    })
  },

  handleGoldWeightInput(event) {
    this.setData({ goldWeight: event.detail.value }, () => this.calculateValue())
  },

  handleGoldKChange(event) {
    this.setData({ goldKIndex: Number(event.detail.value) }, () => this.calculateValue())
  },

  handleComboGoldWeightInput(event) {
    this.setData({ comboMetalWeight: event.detail.value }, () => this.calculateValue())
  },

  handleComboMetalChange(event) {
    this.setData({ comboMetalIndex: Number(event.detail.value) }, () => this.calculateValue())
  },

  handleDiamondCaratInput(event) {
    this.setData({ diamondCarat: event.detail.value }, () => this.calculateValue())
  },

  handleDiamondColorChange(event) {
    this.setData({ diamondColorIndex: Number(event.detail.value) }, () => this.calculateValue())
  },

  handleDiamondClarityChange(event) {
    this.setData({ diamondClarityIndex: Number(event.detail.value) }, () => this.calculateValue())
  },

  handleDiamondCutChange(event) {
    this.setData({ diamondCutIndex: Number(event.detail.value) }, () => this.calculateValue())
  },

  getDiamondQuote() {
    const {
      diamondCarat,
      diamondColorOptions,
      diamondColorIndex,
      diamondClarityOptions,
      diamondClarityIndex,
      diamondCutOptions,
      diamondCutIndex
    } = this.data

    return calcDiamondEstimate({
      carat: diamondCarat,
      colorFactor: diamondColorOptions[diamondColorIndex].factor,
      clarityFactor: diamondClarityOptions[diamondClarityIndex].factor,
      cutFactor: diamondCutOptions[diamondCutIndex].factor
    })
  },

  calculateValue() {
    const {
      goldWeight,
      goldKOptions,
      goldKIndex,
      comboMetalWeight,
      comboMetalIndex,
      comboMetalOptions,
      diamondCarat,
      diamondColorOptions,
      diamondColorIndex,
      diamondClarityOptions,
      diamondClarityIndex,
      diamondCutOptions,
      diamondCutIndex,
      market
    } = this.data

    const goldOption = goldKOptions[goldKIndex]
    const goldEstimatedValue = calcGoldEstimate(goldWeight, goldOption.purity, market.goldPrice24k)
    const goldUnitPrice = getGoldKPrice(market.goldPrice24k, goldOption.purity)
    const goldRecordLabel = `${goldWeight}g / ${goldOption.label}`
    const goldResultDescription = `按当前 ${goldOption.label} 金价 ¥${formatPrice(goldUnitPrice)}/g 估算，适合快速查看黄金价值。`

    const diamondQuote = this.getDiamondQuote()
    const diamondRecordLabel =
      `${diamondCarat}ct / ${diamondColorOptions[diamondColorIndex].value} / ` +
      `${diamondClarityOptions[diamondClarityIndex].value} / ${diamondCutOptions[diamondCutIndex].value}`
    const diamondResultDescription =
      `市场参考价按 ${diamondQuote.basePrice.toFixed(0)}/ct 基准单价和 4C 系数估算。`

    const comboMetal = comboMetalOptions[comboMetalIndex]
    const comboMetalUnitPrice = Number(market.metalPrices[comboMetal.key] || 0)
    const comboMetalEstimate = comboMetalUnitPrice * (Number(comboMetalWeight) || 0)
    const comboRecycleRate = comboMetal.key === 'silver' ? 0.9 : comboMetal.key === 'platinum' ? 0.92 : 0.97
    const comboMarket = comboMetalEstimate + diamondQuote.marketPrice
    const comboRecycleLow = comboMetalEstimate * (comboRecycleRate - 0.03) + diamondQuote.recycleLow
    const comboRecycleHigh = comboMetalEstimate * comboRecycleRate + diamondQuote.recycleHigh
    const comboRecordLabel =
      `${comboMetalWeight}g ${comboMetal.label} + ${diamondCarat}ct ` +
      `${diamondColorOptions[diamondColorIndex].value}/${diamondClarityOptions[diamondClarityIndex].value}/${diamondCutOptions[diamondCutIndex].value}`
    const comboResultDescription =
      `组合参考价 = 贵金属估值 + 钻石市场参考价，当前贵金属按 ¥${formatPrice(comboMetalUnitPrice)}/g 计算。`

    this.setData({
      goldEstimatedValue: formatPrice(goldEstimatedValue),
      goldRecordLabel,
      goldResultDescription,
      diamondEstimatedValue: formatPrice(diamondQuote.marketPrice),
      diamondRecycleRange: `${formatPrice(diamondQuote.recycleLow)} - ${formatPrice(diamondQuote.recycleHigh)}`,
      diamondRecordLabel,
      diamondResultDescription,
      comboEstimatedValue: formatPrice(comboMarket),
      comboRecycleRange: `${formatPrice(comboRecycleLow)} - ${formatPrice(comboRecycleHigh)}`,
      comboRecordLabel,
      comboResultDescription
    })
  },

  saveRecord() {
    const {
      currentTab,
      goldEstimatedValue,
      goldRecordLabel,
      diamondEstimatedValue,
      diamondRecycleRange,
      diamondRecordLabel,
      comboEstimatedValue,
      comboRecycleRange,
      comboRecordLabel
    } = this.data

    const recordMap = {
      gold: {
        title: '黄金估值',
        spec: goldRecordLabel,
        estimatedValue: goldEstimatedValue,
        rangeText: ''
      },
      diamond: {
        title: '钻石估值',
        spec: diamondRecordLabel,
        estimatedValue: diamondEstimatedValue,
        rangeText: diamondRecycleRange
      },
      combo: {
        title: '钻石+贵金属估值',
        spec: comboRecordLabel,
        estimatedValue: comboEstimatedValue,
        rangeText: comboRecycleRange
      }
    }

    const target = recordMap[currentTab]
    pushCalcHistory({
      id: `${Date.now()}`,
      type: currentTab,
      title: target.title,
      spec: target.spec,
      estimatedValue: target.estimatedValue,
      rangeText: target.rangeText,
      createdAt: formatDate()
    })

    wx.showToast({
      title: '已保存记录',
      icon: 'success'
    })
  },

  addToAssets() {
    const {
      currentTab,
      goldEstimatedValue,
      goldRecordLabel,
      diamondEstimatedValue,
      diamondRecycleRange,
      diamondRecordLabel,
      comboEstimatedValue,
      comboRecycleRange,
      comboRecordLabel
    } = this.data

    const assetMap = {
      gold: {
        name: '黄金资产',
        typeText: '黄金',
        spec: goldRecordLabel,
        estimatedValue: goldEstimatedValue,
        remark: '由估值计算页面加入。'
      },
      diamond: {
        name: '钻石资产',
        typeText: '钻石',
        spec: diamondRecordLabel,
        estimatedValue: diamondEstimatedValue,
        remark: `回收参考区间：¥ ${diamondRecycleRange}`
      },
      combo: {
        name: '钻石+贵金属资产',
        typeText: '组合',
        spec: comboRecordLabel,
        estimatedValue: comboEstimatedValue,
        remark: `组合回收参考区间：¥ ${comboRecycleRange}`
      }
    }

    const target = assetMap[currentTab]
    appendAsset({
      id: `${Date.now()}`,
      name: target.name,
      type: currentTab,
      typeText: target.typeText,
      spec: target.spec,
      estimatedValue: target.estimatedValue,
      remark: target.remark,
      createdAt: formatDate()
    })

    wx.showToast({
      title: '已加入台账',
      icon: 'success'
    })
  }
})
