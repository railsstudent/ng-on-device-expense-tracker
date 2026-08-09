export default {
  '*.ts': ['eslint --fix', 'prettier --write'],
  '*.html': ['eslint --fix', 'prettier --write'],
  '*.{json,css,md}': ['prettier --write'],
};
