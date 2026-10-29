/**
 * 搜索引擎配置
 * url 为空表示「站内搜索」：不跳转外部站点，改为筛选当前书签。
 *
 * icon 用静态 import 而非运行时拼字符串：
 * 文件缺失会在构建期直接报错，而不是页面上出现一个 404 的破图。
 */
import baiduIcon from '@/assets/search-icon/baidu.svg'
import bingIcon from '@/assets/search-icon/bing.svg'
import githubIcon from '@/assets/search-icon/github.svg'
import googleIcon from '@/assets/search-icon/google.svg'
import siteIcon from '@/assets/search-icon/home.svg'
import zhihuIcon from '@/assets/search-icon/zhihu.svg'

/** 站内搜索的 key */
export const SITE_SEARCH_KEY = 'site'

export const SEARCH_ENGINES = [
  { key: SITE_SEARCH_KEY, name: '站内', icon: siteIcon, url: '' },
  {
    key: 'google',
    name: '谷歌',
    icon: googleIcon,
    url: 'https://www.google.com/search?q=',
  },
  { key: 'bing', name: '必应', icon: bingIcon, url: 'https://cn.bing.com/search?q=' },
  { key: 'baidu', name: '百度', icon: baiduIcon, url: 'https://www.baidu.com/s?wd=' },
  {
    key: 'zhihu',
    name: '知乎',
    icon: zhihuIcon,
    url: 'https://www.zhihu.com/search?q=',
  },
  {
    key: 'github',
    name: 'GitHub',
    icon: githubIcon,
    url: 'https://github.com/search?q=',
  },
]

/** 默认搜索引擎 */
export const DEFAULT_SEARCH_ENGINE = 'bing'

/** 按 key 取搜索引擎配置，未知 key 回落到默认引擎 */
export function getSearchEngine(key) {
  return (
    SEARCH_ENGINES.find((item) => item.key === key) ||
    SEARCH_ENGINES.find((item) => item.key === DEFAULT_SEARCH_ENGINE) ||
    SEARCH_ENGINES[0]
  )
}
