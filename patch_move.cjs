const fs = require('fs');
const lines = fs.readFileSync('features/dashboard/Dashboard.tsx', 'utf8').split('\n');

const startIndex = 592; // 593 is const confirmedCount
const endIndex = 757;   // 757 is const statsRsvpGrowthData end bracket (line 757:     }, [statsGuests]); )

const calculations = lines.slice(startIndex, endIndex);
lines.splice(startIndex, endIndex - startIndex);

// Find if(loading)
const loadingIndex = lines.findIndex(l => l.includes('if(loading) {'));
if (loadingIndex === -1) {
    console.log('Could not find if(loading)');
    process.exit(1);
}

// insert calculations right before if(loading)
lines.splice(loadingIndex, 0, ...calculations);

fs.writeFileSync('features/dashboard/Dashboard.tsx', lines.join('\n'));
console.log('Done moving calculations!');
