const { getAssetLedger, clearCalcHistory, getCalcHistory, saveAssetLedger, updateAsset, deleteAsset } = require('../../utils/storage')

function getSeedAssets() {
  return [
    {
      id: 'seed-1',
      name: '足金手镯',
      typeText: '黄金',
      spec: '32g / 99.9%',
      estimatedValue: '23272.00',
      remark: '适合按克重与纯度直接估算回收参考价。'
    }
  ]
}

Page({
  data: {
    assets: [],
    history: [],
    totalValue: '0.00',
    editingAssetId: '',
    assetForm: {
      name: '',
      spec: '',
      estimatedValue: '',
      remark: ''
    }
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const assets = getAssetLedger()
    const history = getCalcHistory()
    const normalizedAssets = assets.length ? assets : getSeedAssets()
    if (!assets.length) {
      saveAssetLedger(normalizedAssets)
    }
    const totalValue = normalizedAssets
      .reduce((sum, item) => sum + (Number(item.estimatedValue) || 0), 0)
      .toFixed(2)

    this.setData({
      assets: normalizedAssets,
      history,
      totalValue
    })
  },

  clearHistory() {
    clearCalcHistory()
    this.setData({
      history: []
    })

    wx.showToast({
      title: '历史已清空',
      icon: 'success'
    })
  },

  startEditAsset(event) {
    const assetId = event.currentTarget.dataset.id
    const asset = this.data.assets.find((item) => item.id === assetId)
    if (!asset) {
      return
    }

    this.setData({
      editingAssetId: assetId,
      assetForm: {
        name: asset.name || '',
        spec: asset.spec || '',
        estimatedValue: asset.estimatedValue || '',
        remark: asset.remark || ''
      }
    }, () => {
      this.scrollToEditor()
    })
  },

  cancelEditAsset() {
    this.setData({
      editingAssetId: '',
      assetForm: {
        name: '',
        spec: '',
        estimatedValue: '',
        remark: ''
      }
    })
  },

  handleAssetFormInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`assetForm.${field}`]: event.detail.value
    })
  },

  saveAssetEdit() {
    const { editingAssetId, assetForm } = this.data
    if (!editingAssetId) {
      return
    }

    if (!assetForm.name || !assetForm.spec || !assetForm.estimatedValue) {
      wx.showToast({
        title: '请补全必填信息',
        icon: 'none'
      })
      return
    }

    updateAsset(editingAssetId, {
      name: assetForm.name,
      spec: assetForm.spec,
      estimatedValue: assetForm.estimatedValue,
      remark: assetForm.remark
    })

    this.cancelEditAsset()
    this.loadData()
    wx.showToast({
      title: '资产已更新',
      icon: 'success'
    })
  },

  scrollToEditor() {
    wx.pageScrollTo({
      selector: '.asset-editor',
      duration: 250
    })
  },

  removeAsset(event) {
    const assetId = event.currentTarget.dataset.id
    wx.showModal({
      title: '删除资产',
      content: '确认删除这条资产记录吗？',
      success: (res) => {
        if (!res.confirm) {
          return
        }

        deleteAsset(assetId)
        if (this.data.editingAssetId === assetId) {
          this.cancelEditAsset()
        }
        this.loadData()
        wx.showToast({
          title: '已删除',
          icon: 'success'
        })
      }
    })
  }
})
