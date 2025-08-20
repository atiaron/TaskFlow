module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: ['react-app', 'eslint:recommended'],
  rules: {
    'react/no-danger': 'error',
    'no-restricted-syntax': [
      'error',
      {
        selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
        message: 'אסור להשתמש ב-dangerouslySetInnerHTML. השתמשו ב-deriveTaskMeta + JSX.'
      }
    ]
  }
};
