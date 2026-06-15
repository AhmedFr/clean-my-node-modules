/** Folder names too generic to identify a project on their own. When the */
/** node_modules folder lives in one of these, we qualify it with the repo / */
/** parent so "frontend" becomes e.g. "selfkit / frontend". */
export const GENERIC_NAMES = new Set([
  'frontend', 'front-end', 'front',
  'backend', 'back-end', 'back',
  'web', 'www', 'website', 'site',
  'app', 'apps', 'application',
  'api', 'apis',
  'server', 'client', 'service', 'services',
  'package', 'packages', 'pkg', 'pkgs',
  'src', 'source', 'lib', 'libs', 'library',
  'core', 'common', 'shared', 'base',
  'ui', 'admin', 'dashboard', 'console', 'portal',
  'mobile', 'desktop', 'native',
  'docs', 'doc', 'documentation',
  'main', 'root', 'project', 'code', 'repo',
  'functions', 'function', 'lambda', 'worker', 'workers',
  'cli', 'sdk', 'tools', 'utils', 'util', 'helpers',
  'demo', 'demos', 'example', 'examples', 'sample', 'samples',
  'test', 'tests', 'e2e', 'scripts', 'config', 'infra', 'types',
  'framework', 'frameworks', 'plugin', 'plugins', 'extension', 'extensions',
  'module', 'modules', 'component', 'components', 'integration', 'integrations',
  'feature', 'features', 'store', 'page', 'pages', 'gateway', 'proxy',
])

/** Separator used when qualifying a generic folder name with its repo/parent. */
export const NAME_SEPARATOR = ' / '
