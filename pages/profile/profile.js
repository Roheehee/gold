Page({
  data: {
    userInfo: null,
    loginCode: '',
    memberPlan: {
      name: '订阅会员',
      price: '¥29/月',
      desc: '解锁更多高级功能'
    },
    shortcuts: [
      {
        key: 'contact',
        title: '客服',
        desc: '在线帮助',
        icon: '客'
      },
      {
        key: 'settings',
        title: '设置',
        desc: '偏好管理',
        icon: '设'
      },
      {
        key: 'about',
        title: '关于',
        desc: '版本说明',
        icon: '关'
      },
      {
        key: 'payment',
        title: '付费功能',
        desc: '会员权益',
        icon: '费'
      }
    ]
  },

  onShow() {
    const userInfo = wx.getStorageSync('profile_user_info') || null
    this.setData({ userInfo })
  },

  handleSyncWechatProfile() {
    wx.showActionSheet({
      itemList: ['使用微信用户名', '手动输入用户名'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.syncWechatProfile({
            successToast: '微信用户名已同步'
          })
          return
        }

        this.editCustomNickname()
      }
    })
  },

  editCustomNickname() {
    const currentUserInfo = this.data.userInfo || {}
    wx.showModal({
      title: '设置用户名',
      editable: true,
      placeholderText: '请输入用户名',
      content: currentUserInfo.nickName || '',
      success: (res) => {
        if (!res.confirm) {
          return
        }

        const nickName = (res.content || '').trim()
        if (!nickName) {
          wx.showToast({
            title: '用户名不能为空',
            icon: 'none'
          })
          return
        }

        const userInfo = {
          nickName,
          avatarUrl: currentUserInfo.avatarUrl || ''
        }

        wx.setStorageSync('profile_user_info', userInfo)
        this.setData({ userInfo })
        wx.showToast({
          title: '用户名已更新',
          icon: 'success'
        })
      }
    })
  },

  handleAvatarUpload() {
    wx.showActionSheet({
      itemList: ['使用微信头像', '本地上传头像'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.syncWechatProfile({
            successToast: '微信头像已同步'
          })
          return
        }

        this.chooseLocalAvatar()
      }
    })
  },

  chooseLocalAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file || !file.tempFilePath) {
          return
        }

        const currentUserInfo = this.data.userInfo || {}
        const userInfo = {
          nickName: currentUserInfo.nickName || '用户名',
          avatarUrl: file.tempFilePath
        }

        wx.setStorageSync('profile_user_info', userInfo)
        this.setData({ userInfo })
        wx.showToast({
          title: '头像已更新',
          icon: 'success'
        })
      }
    })
  },

  handleLogin() {
    this.syncWechatProfile({
      successToast: '登录成功',
      withLoginCode: true
    })
  },

  syncWechatProfile(options = {}) {
    const {
      successToast = '同步成功',
      withLoginCode = false
    } = options

    if (typeof wx.getUserProfile !== 'function') {
      wx.showModal({
        title: '当前环境不支持',
        content: '当前微信开发者工具或运行环境不支持微信登录授权，请在最新版开发者工具或真机中重试。',
        showCancel: false
      })
      return
    }

    wx.getUserProfile({
      desc: '用于完善账号信息与同步会员数据',
      success: (profileRes) => {
        wx.showLoading({
          title: withLoginCode ? '登录中' : '同步中',
          mask: true
        })

        const currentUserInfo = this.data.userInfo || {}
        const userInfo = {
          nickName: profileRes.userInfo.nickName || '用户名',
          avatarUrl: profileRes.userInfo.avatarUrl || currentUserInfo.avatarUrl || ''
        }
        wx.setStorageSync('profile_user_info', userInfo)
        this.setData({ userInfo })

        if (!withLoginCode) {
          wx.hideLoading()
          wx.showToast({
            title: successToast,
            icon: 'success'
          })
          return
        }

        wx.login({
          success: (loginRes) => {
            this.setData({
              loginCode: loginRes.code || ''
            })

            wx.hideLoading()
            wx.showToast({
              title: successToast,
              icon: 'success'
            })
          },
          fail: (error) => {
            wx.hideLoading()
            wx.showModal({
              title: '登录失败',
              content: error.errMsg || '获取登录凭证失败，请稍后重试。',
              showCancel: false
            })
          }
        })
      },
      fail: (error) => {
        const isDenied = String(error.errMsg || '').includes('deny')
        wx.showModal({
          title: isDenied ? '你已取消授权' : '登录失败',
          content: isDenied
            ? '微信登录需要你确认授权后才能获取头像和昵称。'
            : (error.errMsg || '获取微信用户信息失败，请稍后重试。'),
          showCancel: false
        })
      }
    })
  },

  navigateMenu(event) {
    const key = event.currentTarget.dataset.key
    const routeMap = {
      settings: '/pages/settings/settings',
      about: '/pages/about/about',
      payment: '/pages/payment/payment'
    }
    const url = routeMap[key]
    if (!url) {
      return
    }
    wx.navigateTo({ url })
  }
})
