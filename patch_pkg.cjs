const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.overrides = {
  ...pkg.overrides,
  "react": "$react",
  "react-dom": "$react-dom",
  "react-window": {
    "react": "$react",
    "react-dom": "$react-dom"
  },
  "react-joyride": {
    "react": "$react",
    "react-dom": "$react-dom"
  }
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Updated package.json');
