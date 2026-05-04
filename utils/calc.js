function calcGoldEstimate(weight, purity, price) {
  const normalizedWeight = Number(weight) || 0
  const normalizedPurity = (Number(purity) || 0) / 100
  const normalizedPrice = Number(price) || 0
  return normalizedWeight * normalizedPurity * normalizedPrice
}

function getGoldKFactor(purity) {
  return (Number(purity) || 0) / 99.9
}

function getGoldKPrice(basePrice, purity) {
  return (Number(basePrice) || 0) * getGoldKFactor(purity)
}

function getDiamondBasePrice(carat) {
  const weight = Number(carat) || 0

  if (weight < 0.3) {
    return 6800
  }

  if (weight < 0.5) {
    return 9800
  }

  if (weight < 1) {
    return 16800
  }

  if (weight < 2) {
    return 29800
  }

  return 43600
}

function getDiamondQualityFactor({ colorFactor, clarityFactor, cutFactor }) {
  return Number(colorFactor || 1) * Number(clarityFactor || 1) * Number(cutFactor || 1)
}

function calcDiamondEstimate({ carat, colorFactor, clarityFactor, cutFactor }) {
  const weight = Number(carat) || 0
  const basePrice = getDiamondBasePrice(weight)
  const qualityFactor = getDiamondQualityFactor({
    colorFactor,
    clarityFactor,
    cutFactor
  })
  const marketPrice = weight * basePrice * qualityFactor
  const recycleLow = marketPrice * 0.38
  const recycleHigh = marketPrice * 0.56

  return {
    basePrice,
    qualityFactor,
    marketPrice,
    recycleLow,
    recycleHigh
  }
}

function buildTrendBars(points) {
  const values = points.map((item) => Number(item.value) || 0)
  const max = Math.max(...values, 1)

  return points.map((item) => ({
    ...item,
    height: `${Math.max(14, Math.round((Number(item.value) / max) * 200))}rpx`
  }))
}

function buildLineChartData(points, options = {}) {
  const width = options.width || 620
  const height = options.height || 280
  const padX = options.padX || 48
  const padY = options.padY || 24
  const values = points.map((item) => Number(item.value || 0)).filter((value) => Number.isFinite(value))

  if (!values.length) {
    return {
      points: [],
      segments: [],
      yTicks: []
    }
  }

  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const rawRange = Math.max(rawMax - rawMin, rawMax * 0.01, 1)
  const padding = Math.max(rawRange * 0.22, 6)
  const min = rawMin - padding
  const max = rawMax + padding
  const range = Math.max(max - min, 1)
  const stepX = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)

  const chartPoints = points.map((item, index) => {
    const value = Number(item.value) || 0
    const x = padX + stepX * index
    const y = height - padY - ((value - min) / range) * (height - padY * 2)

    return {
      ...item,
      pointX: x,
      pointY: y,
      pointLeft: `${x}rpx`,
      pointTop: `${y}rpx`,
      labelLeft: `${x - 28}rpx`,
      valueTop: `${Math.max(0, y - 38)}rpx`,
      valueText: item.valueText || `${value.toFixed(2)}`,
      isMax: value === maxValue,
      isMin: value === minValue
    }
  })

  const segments = chartPoints.slice(0, -1).map((point, index) => {
    const next = chartPoints[index + 1]
    const x1 = padX + stepX * index
    const y1 = parseFloat(point.pointTop)
    const x2 = padX + stepX * (index + 1)
    const y2 = parseFloat(next.pointTop)
    const dx = x2 - x1
    const dy = y2 - y1
    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx) * 180 / Math.PI

    return {
      left: `${x1}rpx`,
      top: `${y1}rpx`,
      width: `${length}rpx`,
      angle: `${angle}deg`
    }
  })

  const yTicks = [0, 0.5, 1].map((ratio) => {
    const value = max - range * ratio
    const y = padY + (height - padY * 2) * ratio

    return {
      y: `${y}rpx`,
      label: `${value.toFixed(0)}`
    }
  })

  return {
    points: chartPoints,
    segments,
    yTicks
  }
}

module.exports = {
  calcGoldEstimate,
  calcDiamondEstimate,
  getDiamondBasePrice,
  getGoldKFactor,
  getGoldKPrice,
  buildTrendBars,
  buildLineChartData
}
