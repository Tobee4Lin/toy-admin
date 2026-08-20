# UI 设计指南

> **设计类型**: App 设计（应用架构设计）
> **确认检查**: 本指南适用于可交互的应用/网站/工具。

> ℹ️ Section 1 为设计意图与决策上下文。Code agent 实现时以 Section 2 及之后的具体参数为准。

## 1. Design Archetype (设计原型)

### 1.1 内容理解

- **目标用户**: B2B玩具制造商管理员，高频后台操作，需快速处理询盘与管理产品数据
- **核心目的**: 高效管理 + 精准决策 + 数据安全导出
- **情绪基调**: 专业掌控 / 避免焦虑混乱

### 1.2 设计方向

- **Design Style**: Grid 网格 — B2B后台需高密度信息展示与精确对齐，等宽数字+冷色调强化数据可信度
- **Application Type**: Admin/SaaS — 决定侧边栏导航+高视口利用率布局
- **Aesthetic Direction**: Linear/Stripe式精密感，深海军蓝锚定品牌权威，电动蓝驱动操作焦点

## 2. Color System (色彩系统)

> 基于应用概要设计指定的 #071A2D + #1565FF 推导，严格遵循约束色值。

**色彩关系**: 深海军蓝主基底 + 电动蓝交互强调 + 冷灰白内容底色
**配色设计理由**: 用户指定色值传达B2B专业信任感，电动蓝在深色背景上形成强操作引导
**主色推导**: Electric Blue #1565FF 直接映射 primary，承载所有"可行动"状态（按钮/开关/激活态）
**使用比例**: 70% 中性白/浅灰底 · 20% 深海军蓝(导航/标题) · 10% 电动蓝(交互焦点)

### 2.1 主题颜色

| Token                | HSL 值                    | 说明                                  |
| -------------------- | ------------------------- | ------------------------------------- |
| `background`         | hsl(216 20% 97%)          | 冷灰白页面底色，减少长时间视觉疲劳    |
| `card`               | hsl(0 0% 100%)            | 纯白卡片容器，与底色形成微层级        |
| `foreground`         | hsl(210 40% 13%)          | 深墨文字，接近#071A2D但可读性更优     |
| `muted-foreground`   | hsl(215 16% 47%)          | 次级说明/禁用态文字                   |
| `primary`            | hsl(217 100% 55%)         | #1565FF 电动蓝，主操作/激活态         |
| `primary-foreground` | hsl(0 0% 100%)            | 白色文字/图标，确保4.5:1对比度        |
| `accent`             | hsl(217 80% 95%)          | 极浅蓝hover/focus/skeleton背景        |
| `accent-foreground`  | hsl(217 100% 40%)         | 深蓝文字用于accent背景上              |
| `border`             | hsl(216 18% 88%)          | 低饱和冷灰边框，不抢夺内容注意力      |

### 2.2 导航区配色

- **基调关系**: 深海军蓝 hsl(210 60% 11%) 独立基底，与白色内容区强分隔建立空间层级
- **关键状态**: 默认半透明白文字 → Hover浅蓝底色 → 激活态电动蓝左侧竖条+白文字 ≥ 7:1
- **边界与背景**: 右侧1px hsl(216 18% 20%) 分割线；移动端抽屉复用同色系加深5%明度

### 2.3 语义颜色

| 用途       | HSL 值           | 衍生逻辑                              |
| ---------- | ---------------- | ------------------------------------- |
| success    | hsl(152 60% 42%) | 绿色系，背景 hsl(152 50% 95%)         |
| warning    | hsl(38 92% 50%)  | 琥珀色，仅大字号或搭配深色文字        |
| destructive| hsl(0 72% 51%)   | 红色系，新询盘红点徽章/删除操作       |

## 3. Typography (字体排版)

- **Heading**: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif
- **Body**: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif
- **Mono/Data**: JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace（表格数值/货号/JSON预览专用）
- **字体策略**: Inter保障多语言兼容与屏幕渲染精度；JetBrains Mono强化数据列对齐与代码片段辨识度

## 4. Layout Strategy (布局策略)

- **导航意图**: 持久型左侧Sidebar（应用概要设计已声明），移动端折叠为Drawer；至多一套全局导航
- **页面架构**: Sidebar固定240px + 主内容区 `max-w-[1400px]` 居中，Topbar高度56px含面包屑与用户菜单
- **响应式**: ≥1024px双栏常驻；<1024px Sidebar收起为汉堡菜单，内容区全宽+底部安全间距

## 5. Visual Language (视觉语言)

- **形态参数**: 圆角 `rounded-md (0.375rem)` · 阴影 `shadow-sm` 仅卡片/弹窗 · 间距基调 `standard`
- **识别签名**: 表格行首彩色分类标识块 · 表单Tab下划线激活态 · 数据列等宽数字右对齐
- **装饰策略**: 无多余装饰；仅用1px分割线与色彩区块建立结构韵律
- **动效原则**: 即时反馈150ms ease-out；抽屉滑入200ms cubic-bezier(0.16,1,0.3,1)
- **可及性**: 正文 ≥ 4.5:1；深色导航白字 ≥ 7:1；复杂背景加遮罩；Focus环2px offset

## 6. Component Principles (组件原则)

- **状态完整性**: Button/Input/Switch/Tabs覆盖Default/Hover/Focus/Active/Disabled；Skeleton加载占位
- **层级清晰**: Primary实心蓝 vs Secondary描边蓝 vs Ghost透明；Error态红框+下方提示文字
- **一致性**: 所有表格统一行高48px、缩略图40×40 rounded；Toast右上角弹出自动消失3s

## 7. Image Direction (图片与视觉资产)

- **Image Role**: 无强制图片需求；优先通过分类色块、状态标签、数据图表建立视觉记忆点
- **Image Art Direction**: 无
- **Image Prompt Keywords**: 无
- **Image Avoidance**: 禁止通用商务插画、玩具实拍图、抽象科技渐变；空状态仅用Lucide线性图标+文案引导

## 8. 应避免 (Anti-patterns)

- 避免浅色/透明Sidebar破坏深海军蓝品牌锚点与内容区层级分离
- 避免表格使用斑马纹，改用Hover高亮+精选状态电动蓝Toggle作为视觉节奏
- 避免表单区块无边框堆叠，必须用Card容器+分区标题建立编辑节奏感