const fs = require('fs');
let content = fs.readFileSync('features/invitation/InvitationView.tsx', 'utf8');
content = content.replace(/(?:\s*onCheckStatus\?\:\s*\(\)\s*\=\>\s*void\;)+/g, '\n  onCheckStatus?: () => void;');
content = content.replace(/(?:\s*onCheckStatus\,)+/g, '\n  onCheckStatus,');
fs.writeFileSync('features/invitation/InvitationView.tsx', content);
