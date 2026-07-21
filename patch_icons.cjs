const fs = require('fs');
const file = 'index.html';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  ".material-symbols-outlined {",
  ".material-symbols-outlined {\n        font-family: 'Material Symbols Outlined', sans-serif !important;"
);
if (!content.includes('font-family: \'Material Symbols Outlined\'')) {
    content = content.replace(
        ".material-symbols-outlined {",
        ".material-symbols-outlined {\n        font-family: 'Material Symbols Outlined', sans-serif !important;"
    );
}
fs.writeFileSync(file, content);
