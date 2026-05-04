Component({
  properties: {
    text: {
      type: String,
      value: '按钮'
    },
    type: {
      type: String,
      value: 'primary'
    },
    block: {
      type: Boolean,
      value: false
    },
    loading: {
      type: Boolean,
      value: false
    },
    disabled: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    handleTap() {
      if (this.data.loading || this.data.disabled) {
        return
      }

      this.triggerEvent('tap')
    }
  }
})
