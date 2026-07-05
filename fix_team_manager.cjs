const fs = require('fs');

let file = fs.readFileSync('features/dashboard/TeamManager.tsx', 'utf8');

file = file.replace(
    'interface TeamManagerProps {\n    eventId: string;\n    eventPlan?: string;\n}',
    'interface TeamManagerProps {\n    event: any;\n}'
);

file = file.replace(
    'export const TeamManager: React.FC<TeamManagerProps> = ({ eventId, eventPlan }) => {',
    'export const TeamManager: React.FC<TeamManagerProps> = ({ event }) => {\n    const eventId = event.id;\n    const eventPlan = event.plan;'
);

const oldCopyLink = `    const handleCopyLink = (member: TeamMember) => {
        const path = member.role === 'viewer'
            ? \`\${getPublicOrigin()}/client-dashboard/\${eventId}?token=B2B_PARTNER\`
            : member.role === 'scanner'
                ? \`\${getPublicOrigin()}/checkin/\${eventId}\`
                : \`\${getPublicOrigin()}/dashboard/\${eventId}\`;
        copyToClipboard(path);
        setCopiedId(member.id);
        toast.success("Link específico copiado!");
        setTimeout(() => setCopiedId(null), 3000);
    };`;

const newCopyLink = `    const handleCopyLink = async (member: TeamMember) => {
        let token = event.clientToken;
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
        toast.success("Link específico copiado!");
        setTimeout(() => setCopiedId(null), 3000);
    };`;

file = file.replace(oldCopyLink, newCopyLink);

fs.writeFileSync('features/dashboard/TeamManager.tsx', file);
console.log("Updated TeamManager");
