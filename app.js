const { STORAGE_KEYS } = require('./config/index')

App({
  globalData: {
    appName: '黄金钻石估值计算器',
    theme: {
      primary: '#f4c542',
      secondary: '#fff8de',
      accent: '#1e293b',
      background: '#fffdf6'
    },
    market: {
      goldPrice: 728,
      diamondPrice: 9800,
      updatedAt: '2026-05-04 23:20'
    }
  },

  onLaunch() {
    if (!wx.getStorageSync(STORAGE_KEYS.ASSET_LEDGER)) {
      wx.setStorageSync(STORAGE_KEYS.ASSET_LEDGER, [])
    }

    if (!wx.getStorageSync(STORAGE_KEYS.CALC_HISTORY)) {
      wx.setStorageSync(STORAGE_KEYS.CALC_HISTORY, [])
    }
  }
})
