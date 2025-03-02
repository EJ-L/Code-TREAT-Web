# Code TREAT

Code LLM Trustworthiness/Reliability Evaluation and Testing

## 项目简介

这是一个用于评估和测试代码 LLM 可信度和可靠性的工具。该项目使用 Next.js 构建，提供了直观的界面来分析和比较不同 LLM 模型在代码生成、翻译、总结等任务上的表现。

## 技术栈

- Next.js 14
- React
- TypeScript
- TailwindCSS

## 本地开发

1. 克隆仓库：
```bash
git clone [repository-url]
```

2. 安装依赖：
```bash
npm install
# 或
yarn install
```

3. 运行开发服务器：
```bash
npm run dev
# 或
yarn dev
```

4. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)

## 部署

项目已配置为可以直接部署到 Vercel 平台。只需将代码推送到主分支，Vercel 将自动部署更新。

## 环境变量

如果需要设置环境变量，请在项目根目录创建 `.env.local` 文件：

```env
# 示例环境变量
NEXT_PUBLIC_API_URL=your-api-url
```

## 贡献指南

1. Fork 该仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request 