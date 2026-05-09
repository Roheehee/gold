const { getMarketSnapshot } = require('../../api/market')
const { buildLineChartData } = require('../../utils/calc')
const { formatPrice, formatTrend } = require('../../utils/format')

Page({
  data: {
    loading: true,
    metalOptions: [
      { label: '黄金24K', key: 'gold24k' },
      { label: '黄金22K', key: 'gold22k' },
      { label: '黄金18K', key: 'gold18k' },
      { label: '黄金14K', key: 'gold14k' },
      { label: '黄金9K', key: 'gold9k' },
      { label: '铂金', key: 'platinum' },
      { label: '银', key: 'silver' }
    ],
    selectedMetalIndex: 0,
    trendTabs: [
      { key: 'day', label: '按天' },
      { key: 'week', label: '按周' },
      { key: 'month', label: '按月' }
    ],
    currentTrendTab: 'day',
    snapshot: null,
    goldLinePoints: [],
    goldLineSegments: [],
    goldYAxis: [],
    activePointIndex: -1,
    activePoint: null,
    priceSummary: {
      selectedLabel: '黄金24K',
      selectedPrice: '0.00',
      selectedChange: '+0.0%'
    }
  },

  onLoad() {
    this.loadMarket()
  },

  async loadMarket() {
    const response = await getMarketSnapshot()
    const snapshot = response.data
    this.metalVolatility = snapshot.metalVolatility || {}
    this.metalPrices = snapshot.metalPrices || {}
    this.metalChanges = snapshot.metalChanges || {}

    this.setData({
      loading: false,
      snapshot: {
        goldPrice24k: formatPrice(snapshot.goldPrice),
        updatedAt: snapshot.updatedAt,
        goldChange: formatTrend(snapshot.goldChange)
      }
    })

    const info = wx.getSystemInfoSync()
    this.pxPerRpx = info.windowWidth / 750
    const chartWidth = Math.round((info.windowWidth - 24) * 750 / info.windowWidth)
    const chartHeight = Math.max(
      500,
      Math.round(info.windowHeight * 0.58 * 750 / info.windowWidth)
    )

    this.setData({
      chartWidth,
      chartHeight
    })

    this.updateTrendChart('day')
  },

  handleMetalChange(event) {
    const selectedMetalIndex = Number(event.detail.value)
    this.setData({ selectedMetalIndex }, () => {
      this.updateTrendChart(this.data.currentTrendTab)
    })
  },

  handleTrendTabChange(event) {
    const currentTrendTab = event.currentTarget.dataset.tab
    this.setData({ currentTrendTab }, () => {
      this.updateTrendChart(currentTrendTab)
    })
  },

  handlePointTap(event) {
    if (this.data.currentTrendTab === 'day') {
      return
    }

    const index = Number(event.currentTarget.dataset.index)
    this.activatePointByIndex(index)
  },

  handleChartTouchStart(event) {
    if (this.data.currentTrendTab !== 'day') {
      return
    }

    this.activateNearestPoint(event)
  },

  handleChartTouchMove(event) {
    if (this.data.currentTrendTab !== 'day') {
      return
    }

    this.activateNearestPoint(event)
  },

  handleChartTouchEnd() {
    if (this.data.currentTrendTab !== 'day') {
      return
    }
  },

  activateNearestPoint(event) {
    if (!this.chartRect || !this.data.goldLinePoints.length) {
      return
    }

    const touch = (event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0])
    if (!touch) {
      return
    }

    const relativeX = touch.clientX - this.chartRect.left
    let nearestIndex = 0
    let nearestDistance = Infinity

    this.data.goldLinePoints.forEach((point, index) => {
      const pointX = Number(point.pointX || 0) * this.pxPerRpx
      const distance = Math.abs(relativeX - pointX)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    })

    this.activatePointByIndex(nearestIndex)
  },

  activatePointByIndex(index) {
    const point = this.data.goldLinePoints[index]

    if (!point) {
      return
    }

    this.setData({
      activePointIndex: index,
      activePoint: {
        label: point.label,
        valueText: point.valueText,
        pointLeft: point.pointLeft,
        pointTop: point.pointTop,
        tooltipLeft: point.labelLeft,
        tooltipTop: `${Math.max(12, parseFloat(point.pointTop) - 90)}rpx`
      }
    })
  },

  clearActivePoint() {
    this.setData({
      activePointIndex: -1,
      activePoint: null
    })
  },

  updateTrendChart(rangeType) {
    const selectedMetal = this.data.metalOptions[this.data.selectedMetalIndex]
    const volatilityGroup = this.metalVolatility && this.metalVolatility[selectedMetal.key] ? this.metalVolatility[selectedMetal.key] : {}
    const source = volatilityGroup && volatilityGroup[rangeType] ? volatilityGroup[rangeType] : []
    const normalized = source.map((item) => ({
      ...item,
      valueText: `¥${formatPrice(item.value)}`
    }))
    const chart = buildLineChartData(normalized, {
      width: this.data.chartWidth || 700,
      height: this.data.chartHeight || 480,
      padX: 76,
      padY: 18
    })
    const selectedPrice = this.metalPrices && this.metalPrices[selectedMetal.key] ? this.metalPrices[selectedMetal.key] : 0
    const selectedChange = this.metalChanges && typeof this.metalChanges[selectedMetal.key] !== 'undefined'
      ? formatTrend(this.metalChanges[selectedMetal.key])
      : this.data.snapshot.goldChange

    this.setData({
      goldLinePoints: chart.points,
      goldLineSegments: chart.segments,
      goldYAxis: chart.yTicks,
      activePointIndex: -1,
      activePoint: null,
      priceSummary: {
        selectedLabel: selectedMetal.label,
        selectedPrice: formatPrice(selectedPrice),
        selectedChange
      }
    })

    this.measureChartRect()
  },

  measureChartRect() {
    const query = wx.createSelectorQuery()
    query.select('#market-line-chart').boundingClientRect((rect) => {
      if (rect) {
        this.chartRect = rect
      }
    }).exec()
  }
})
