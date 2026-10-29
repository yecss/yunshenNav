module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
    // 让 <script setup> 里的 defineProps / defineEmits / defineExpose 被识别
    'vue/setup-compiler-macros': true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    // 路由页面组件统一叫 index.vue，允许单词命名
    'vue/multi-word-component-names': ['error', { ignores: ['index'] }],
  },
  overrides: [
    {
      // Worker 运行在 Cloudflare 的 V8 隔离环境（Service Worker 语义）
      files: ['worker/**/*.js'],
      env: { browser: true, node: false, serviceworker: true },
      globals: {
        Response: 'readonly',
        Request: 'readonly',
        crypto: 'readonly',
      },
    },
    {
      // 验证脚本靠 console 输出断言结果，no-console 在这里没有意义
      files: ['scripts/**/*.cjs'],
      env: { browser: false, node: true },
      rules: { 'no-console': 'off' },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', 'public/'],
}
