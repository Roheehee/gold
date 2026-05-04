# 黄金钻石估值计算器

原生微信小程序脚手架，定位为工具类产品，采用黄白科技风格，开箱即用。

## 项目结构

- `pages/`
  - `home/` 首页估值计算器
  - `market/` 行情页与走势图
  - `mine/` 我的资产与历史记录
- `components/`
  - `ui-button/`
  - `ui-card/`
  - `ui-empty/`
  - `ui-field/`
  - `ui-list-item/`
  - `ui-loading/`
- `utils/` 计算、格式化、本地存储、请求工具
- `api/` 模拟数据接口
- `config/` 全局常量和配置

## 运行方式

1. 打开微信开发者工具
2. 导入目录 `/Users/heeheero/Desktop/wx/gold-diamond-calculator`
3. 使用游客模式或替换 `project.config.json` 中的 `appid`
4. 点击编译即可运行

## 说明

- 当前行情页内置了可直接运行的模拟价格数据和趋势图
- 历史计算记录与资产台账使用本地存储，可直接体验完整流程
