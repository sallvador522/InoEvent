const fs = require('fs');
let content = fs.readFileSync('features/dashboard/Dashboard.tsx', 'utf8');

// There's an extra `)}` leftover 
const badPattern = `                    )}
                    {(event?.plan === 'Business' || event?.plan === 'Corporate' || event?.plan === 'Premium') && (
                        <button 
                            onClick={() => setActiveTab('messages')}`;

const fixPattern = `                    {(event?.plan === 'Business' || event?.plan === 'Corporate' || event?.plan === 'Premium') && (
                        <button 
                            onClick={() => setActiveTab('messages')}`;

content = content.replace(badPattern, fixPattern);
fs.writeFileSync('features/dashboard/Dashboard.tsx', content);
