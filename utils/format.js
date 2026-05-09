function formatPrice(value) {
  return Number(value || 0).toFixed(2)
}

function normalizeDateInput(date) {
  if (!date) {
    return new Date()
  }

  if (date instanceof Date) {
    return date
  }

  if (typeof date === 'number') {
    return new Date(date < 1e12 ? date * 1000 : date)
  }

  const raw = String(date).trim()
  if (/^\d+$/.test(raw)) {
    const numeric = Number(raw)
    return new Date(numeric < 1e12 ? numeric * 1000 : numeric)
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed
  }

  return new Date(raw.replace(/-/g, '/'))
}

function formatDate(date = new Date()) {
  const target = normalizeDateInput(date)
  if (Number.isNaN(target.getTime())) {
    return '--'
  }

  const year = target.getFullYear()
  const month = String(target.getMonth() + 1).padStart(2, '0')
  const day = String(target.getDate()).padStart(2, '0')
  const hours = String(target.getHours()).padStart(2, '0')
  const minutes = String(target.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function formatTrend(value) {
  const amount = Number(value || 0)
  const prefix = amount > 0 ? '+' : ''
  return `${prefix}${amount.toFixed(1)}%`
}

module.exports = {
  formatPrice,
  formatDate,
  formatTrend
}
