import { defineConfig } from 'tsup';

/**
 * tsup 构建配置
 * - 同时输出 CJS（.cjs）和 ESM（.mjs）产物
 * - 生成 .d.ts 类型声明文件
 * - 代码压缩
 */
export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    minify: true,
    clean: true,
    target: 'node18',
    sourcemap: false,
    outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.mjs' })
});
