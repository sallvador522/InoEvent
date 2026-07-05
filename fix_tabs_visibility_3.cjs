const fs = require('fs');
let content = fs.readFileSync('features/dashboard/Dashboard.tsx', 'utf8');

// There's an extra empty element after Mapa das Mesas check:
/*
                    {(event?.plan === 'Business' || event?.plan === 'Corporate' || event?.plan === 'Premium') && (
                        <button 
                            onClick={() => setActiveTab('tables')}
                            ...
                        >
                            <span className="material-symbols-outlined text-[18px]">table_restaurant</span> Mapa das Mesas
                        </button>
                    )}
                    {(event?.plan === 'Business' || event?.plan === 'Corporate' || event?.plan === 'Premium') && (

                        <button 
                            onClick={() => setActiveTab('gifts')}
*/

const badPattern = `                    {(event?.plan === 'Business' || event?.plan === 'Corporate' || event?.plan === 'Premium') && (

                        <button 
                            onClick={() => setActiveTab('gifts')}`;

const fixPattern = `
                        <button 
                            onClick={() => setActiveTab('gifts')}`;

content = content.replace(badPattern, fixPattern);
fs.writeFileSync('features/dashboard/Dashboard.tsx', content);
