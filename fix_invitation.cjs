const fs = require('fs');
let content = fs.readFileSync('features/invitation/InvitationView.tsx', 'utf8');
content = content.replace(/(onCheckStatus\?\:\s*\(\)\s*\=\>\s*void\;\s*){2,}/g, 'onCheckStatus?: () => void;\n');
content = content.replace(/(onCheckStatus,\s*){2,}/g, 'onCheckStatus, ');
content = content.replace(/(const\s+isPremium\s+\=\s+event\s+\&\&\s+\(event\s+as\s+any\)\.plan\s+\&\&\s+\(\(event\s+as\s+any\)\.plan\s+\=\=\=\s+"Premium"\s+\|\|\s+\(event\s+as\s+any\)\.plan\s+\=\=\=\s+"Business"\s+\|\|\s+\(event\s+as\s+any\)\.plan\s+\=\=\=\s+"Corporate"\)\;\s*){2,}/g, 'const isPremium = event && (event as any).plan && ((event as any).plan === "Premium" || (event as any).plan === "Business" || (event as any).plan === "Corporate");\n  ');
content = content.replace(/(const\s+isPremium\s+\=\s+event\.plan\s+\=\=\=\s+\"Premium\"\s+\|\|\s+event\.plan\s+\=\=\=\s+\"Business\"\s+\|\|\s+event\.plan\s+\=\=\=\s+\"Corporate\"\;\s*){2,}/g, 'const isPremium = event.plan === "Premium" || event.plan === "Business" || event.plan === "Corporate";\n  ');
fs.writeFileSync('features/invitation/InvitationView.tsx', content);
