# vplist

TypeScript 编写的 [AList](https://github.com/alist-org/alist) API 客户端，支持登录认证、文件列表、上传下载、搜索及基本文件操作。

## 功能

- 登录认证（支持账号密码或直接传入 Token）
- 列出目录文件
- 获取文件信息与下载地址
- 上传文件（带进度回调）
- 创建/删除/重命名/移动/复制文件
- 搜索文件
- TypeScript 类型定义完整

## 安装

```bash
npm install vplist-node
# 或
pnpm add vplist-node
```

## 快速开始

```ts
import { AListClient } from 'vplist-node'

const alist = new AListClient({
  baseURL: 'http://localhost:5244',
  username: 'admin',
  password: 'your-password',
})

// 登录（会自动保存 token）
await alist.login()

// 列出目录
const result = await alist.list('/')
console.log(result.content)

// 获取文件下载地址
const url = await alist.downloadUrl('/video/test.mp4')
console.log(url)

// 上传文件
await alist.upload('./local.mp4', '/alist/test.mp4', (progress) => {
  console.log(`上传进度：${(progress * 100).toFixed(1)}%`)
})
```

## API

### `new AListClient(options)`

```ts
interface AListClientOptions {
  baseURL: string           // AList 服务地址，如 http://localhost:5244
  username?: string         // 登录用户名
  password?: string         // 登录密码
  clientId?: string         // 稳定的客户端 ID（可选）
  timeout?: number          // 请求超时时间，默认 30000ms
  token?: string            // 已有的 token，跳过登录
}
```

### 方法列表

| 方法 | 说明 |
|------|------|
| `login()` | 使用配置的用户名密码登录 |
| `setToken(token)` | 手动设置 token |
| `getToken()` | 获取当前 token |
| `me()` | 获取当前登录用户信息 |
| `list(path \| options)` | 获取目录文件列表，支持分页 |
| `get(filePath)` | 获取单个文件/目录信息 |
| `mkdir(dirPath)` | 创建目录 |
| `remove(dir, names)` | 删除目录下的多个文件 |
| `removeFile(filePath)` | 删除单个文件（便捷方法） |
| `rename(filePath, name)` | 重命名文件/目录 |
| `move(srcDir, dstDir, names)` | 移动文件 |
| `copy(srcDir, dstDir, names)` | 复制文件 |
| `upload(localFile, remotePath, onProgress?)` | 上传文件，可选进度回调 |
| `downloadInfo(filePath)` | 获取文件下载详情 |
| `downloadUrl(filePath)` | 获取文件下载直链 |
| `search(parent, keywords, options?)` | 搜索文件 |

### `AListError`

所有请求失败会抛出 `AListError`，包含 `code`（AList 返回的错误码）和 `response`（原始响应体）。

## 开发

```bash
# 安装依赖
npm install

# 运行示例（需要本地有运行中的 AList 服务）
npm run dev

# 构建（输出 dist/，含 CJS 和 ESM）
npm run build
```

## 许可证

ISC
