const fs = require('fs');

let file = fs.readFileSync('features/dashboard/TeamManager.tsx', 'utf8');

const regexCopyLink = /const handleCopyLink = \(member: TeamMember\) => \{[\s\S]*?setTimeout\(\(\) => setCopiedId\(null\), 3000\);\n    \};/m;

const newCopyLink = `const handleCopyLink = async (member: TeamMember) => {
        let token = event?.clientToken || '';
        if (!token && (member.role === 'scanner' || member.role === 'viewer')) {
            token = Math.random().toString(36).substring(2, 8).toUpperCase();
            try {
                await updateDoc(doc(db, 'events', event.id), { clientToken: token });
            } catch (error) {
                console.error("Error generating token", error);
            }
        }
        
        const path = member.role === 'viewer'
            ? \`\${getPublicOrigin()}/client-dashboard/\${eventId}?token=\${token}\`
            : member.role === 'scanner'
                ? \`\${getPublicOrigin()}/checkin/\${eventId}?token=\${token}&mode=reception\`
                : \`\${getPublicOrigin()}/dashboard/\${eventId}\`;
                
        copyToClipboard(path);
        setCopiedId(member.id);
        toast.success("Link de acesso copiado!");
        setTimeout(() => setCopiedId(null), 3000);
    };`;

file = file.replace(regexCopyLink, newCopyLink);
fs.writeFileSync('features/dashboard/TeamManager.tsx', file);
console.log("TeamManager updated 2.");
