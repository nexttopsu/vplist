import { AListClient } from './src'
import path from 'node:path'

const alist = new AListClient({
  baseURL: 'http://localhost:5244',
  username: 'admin',
  password: 'Mwl9Yjqe',
  clientId: 'my-node-service',
})

;(async () => {
  try {
    // 登录
    await alist.login()

    // 上传
    // await alist.upload(
    //   path.resolve('test.mp4'),
    //   '/alist/test.mp4',
    //   (progress) => {
    //     console.log(
    //       `上传进度：${(progress * 100).toFixed(2)}%`
    //     )
    //   }
    // )
    // console.log('上传成功')


    const url = await alist.downloadUrl('/alist/test.mp4')

    console.log('下载地址：', url)

    // 再查看一下
    // const files = await alist.list('/alist')

    // console.log(files.content)
  } catch (error) {
    console.error('失败:', error)
  }
})()
