Page({
  data: {
    notifications: true,
    assetSync: false
  },

  handleNotificationChange(event) {
    this.setData({
      notifications: event.detail.value
    })
  },

  handleAssetSyncChange(event) {
    this.setData({
      assetSync: event.detail.value
    })
  }
})
