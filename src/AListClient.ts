import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios'
import fs from 'node:fs'

export interface AListResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface AListFile {
  name: string
  size: number
  type: number
  is_dir: boolean
  modified: string
  created: string
  sign?: string
  thumb?: string
  hashinfo?: {
    md5?: string
    sha1?: string
  }
  raw_url?: string
  url?: string
  parent?: string
}

export interface AListListResult {
  content: AListFile[]
  total: number
  readme?: string
  header?: string
  provider?: string
}

export interface AListListOptions {
  path: string
  page?: number
  per_page?: number
  password?: string
  refresh?: boolean
}

export interface AListLoginResult {
  token: string
  device_key?: string
}

export interface AListClientOptions {
  baseURL: string

  /**
   * 登录信息
   */
  username?: string
  password?: string

  /**
   * 稳定的客户端 ID
   */
  clientId?: string

  /**
   * 请求超时时间
   */
  timeout?: number

  /**
   * 已经存在的 token
   */
  token?: string
}

export class AListError extends Error {
  code?: number
  response?: any

  constructor(
    message: string,
    code?: number,
    response?: any,
  ) {
    super(message)

    this.name = 'AListError'
    this.code = code
    this.response = response
  }
}

export class AListClient {
  private client: AxiosInstance

  private token?: string

  private username?: string

  private password?: string

  private clientId?: string

  constructor(options: AListClientOptions) {
    this.username = options.username
    this.password = options.password
    this.clientId = options.clientId
    this.token = options.token

    this.client = axios.create({
      baseURL: options.baseURL.replace(/\/$/, ''),
      timeout: options.timeout ?? 30_000,
    })

    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = this.token
      }

      if (this.clientId) {
        config.headers['Client-Id'] = this.clientId
      }

      return config
    })
  }

  /**
   * 通用请求
   */
  private async request<T = any>(
    config: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<AListResponse<T>> =
        await this.client.request(config)

      const result = response.data

      if (result.code !== 200) {
        throw new AListError(
          result.message || 'AList API 请求失败',
          result.code,
          result,
        )
      }

      return result.data
    } catch (error: any) {
      if (error instanceof AListError) {
        throw error
      }

      const message =
        error?.response?.data?.message ||
        error?.message ||
        'AList 请求失败'

      throw new AListError(
        message,
        error?.response?.data?.code,
        error?.response?.data,
      )
    }
  }

  /**
   * 登录
   */
  async login(): Promise<AListLoginResult> {
    if (!this.username || !this.password) {
      throw new Error('未配置 AList username/password')
    }

    const data = await this.request<AListLoginResult>({
      method: 'POST',
      url: '/api/auth/login',
      data: {
        username: this.username,
        password: this.password,
      },
    })

    this.token = data.token

    return data
  }

  /**
   * 设置 Token
   */
  setToken(token: string) {
    this.token = token
  }

  /**
   * 获取 Token
   */
  getToken() {
    return this.token
  }

  /**
   * 获取当前用户
   */
  async me() {
    return this.request({
      method: 'GET',
      url: '/api/me',
    })
  }

  /**
   * 获取目录文件列表
   */
  async list(
    options: AListListOptions | string,
  ): Promise<AListListResult> {
    const params =
      typeof options === 'string'
        ? {
            path: options,
            page: 1,
            per_page: 100,
            refresh: false,
          }
        : {
            page: 1,
            per_page: 100,
            refresh: false,
            ...options,
          }

    return this.request<AListListResult>({
      method: 'POST',
      url: '/api/fs/list',
      data: params,
    })
  }

  /**
   * 获取单个文件/目录信息
   */
  async get(filePath: string): Promise<AListFile> {
    return this.request<AListFile>({
      method: 'POST',
      url: '/api/fs/get',
      data: {
        path: filePath,
      },
    })
  }

  /**
   * 创建目录
   */
  async mkdir(dirPath: string) {
    return this.request({
      method: 'POST',
      url: '/api/fs/mkdir',
      data: {
        path: dirPath,
      },
    })
  }

  /**
   * 删除文件或目录
   *
   * 例如：
   * remove('/video', ['a.mp4', 'b.mp4'])
   */
  async remove(
    dir: string,
    names: string[],
  ) {
    return this.request({
      method: 'POST',
      url: '/api/fs/remove',
      data: {
        dir,
        names,
      },
    })
  }

  /**
   * 删除单个文件
   *
   * 例如：
   * removeFile('/video/a.mp4')
   */
  async removeFile(filePath: string) {
    const normalized = filePath.replace(/\\/g, '/')

    const index = normalized.lastIndexOf('/')

    const dir =
      index <= 0
        ? '/'
        : normalized.substring(0, index)

    const name = normalized.substring(index + 1)

    return this.remove(dir, [name])
  }

  /**
   * 重命名
   *
   * path: 原文件路径
   * name: 新名称
   */
  async rename(
    filePath: string,
    name: string,
  ) {
    return this.request({
      method: 'POST',
      url: '/api/fs/rename',
      data: {
        path: filePath,
        name,
      },
    })
  }

  /**
   * 移动文件
   *
   * srcDir: 原目录
   * dstDir: 目标目录
   * names: 文件名数组
   */
  async move(
    srcDir: string,
    dstDir: string,
    names: string[],
  ) {
    return this.request({
      method: 'POST',
      url: '/api/fs/move',
      data: {
        src_dir: srcDir,
        dst_dir: dstDir,
        names,
      },
    })
  }

  /**
   * 复制文件
   */
  async copy(
    srcDir: string,
    dstDir: string,
    names: string[],
  ) {
    return this.request({
      method: 'POST',
      url: '/api/fs/copy',
      data: {
        src_dir: srcDir,
        dst_dir: dstDir,
        names,
      },
    })
  }

  /**
   * 上传文件
   *
   * filePath: 本地文件
   * remotePath: AList 中的完整路径
   *
   * 例如：
   *
   * upload(
   *   './test.mp4',
   *   '/video/test.mp4'
   * )
   */
  async upload(
    filePath: string,
    remotePath: string,
    onProgress?: (
      progress: number,
    ) => void,
  ) {
    const stat = await fs.promises.stat(filePath)

    const stream = fs.createReadStream(filePath)

    return this.request({
      method: 'PUT',
      url: '/api/fs/put',
      headers: {
        'File-Path': encodeURIComponent(
          remotePath,
        ),
        'Content-Length': stat.size,
        'Content-Type': 'application/octet-stream',
      },
      data: stream,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,

      onUploadProgress(event) {
        if (
          onProgress &&
          event.total
        ) {
          const progress =
            event.loaded / event.total

          onProgress(progress)
        }
      },
    })
  }

  /**
   * 获取下载/播放信息
   */
  async downloadInfo(
    filePath: string,
  ) {
    return this.request({
      method: 'POST',
      url: '/api/fs/get',
      data: {
        path: filePath,
      },
    })
  }

  /**
   * 获取文件下载地址
   */
  async downloadUrl(
    filePath: string,
  ): Promise<string> {
    const data =
      await this.downloadInfo(filePath)

    if (data.raw_url) {
      return data.raw_url
    }

    if (data.url) {
      return data.url
    }

    throw new AListError(
      'AList 没有返回文件下载地址',
    )
  }

  /**
   * 搜索文件
   */
  async search(
    parent: string,
    keywords: string,
    options: {
      page?: number
      per_page?: number
      scope?: number
    } = {},
  ) {
    return this.request({
      method: 'POST',
      url: '/api/fs/search',
      data: {
        parent,
        keywords,
        page: options.page ?? 1,
        per_page: options.per_page ?? 100,
        scope: options.scope ?? 0,
      },
    })
  }
}
