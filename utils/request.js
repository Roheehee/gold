const { BASE_URL } = require('../config/index')

function normalizeUrl(url) {
  if (/^https?:\/\//.test(url)) {
    return url
  }

  return `${BASE_URL}${url || ''}`
}

function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: normalizeUrl(options.url),
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        ...(options.header || {})
      },
      timeout: options.timeout || 8000,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
          return
        }

        reject({
          message: '请求失败',
          statusCode: res.statusCode,
          data: res.data
        })
      },
      fail(error) {
        reject({
          message: '网络异常',
          error
        })
      }
    })
  })
}

module.exports = {
  request,
  normalizeUrl
}
