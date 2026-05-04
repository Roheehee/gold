Component({
  properties: {
    label: {
      type: String,
      value: ''
    },
    value: {
      type: String,
      value: ''
    },
    placeholder: {
      type: String,
      value: '请输入'
    },
    type: {
      type: String,
      value: 'text'
    },
    unit: {
      type: String,
      value: ''
    }
  },

  methods: {
    handleInput(event) {
      this.triggerEvent('input', {
        value: event.detail.value
      })
    }
  }
})
