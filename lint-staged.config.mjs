export default {
  '*.{ts,html}': ['cspell', 'eslint --fix', 'prettier --write'],
  '*.{json,css,md}': ['cspell', 'prettier --write'],
};
