const fs = require('fs');
let code = fs.readFileSync('features/dashboard/Dashboard.tsx', 'utf8');

code = code.replace(
`    const statsCheckinTimeline: any = {};
    statsGuests.forEach(g => {
        if (g.checkedInAt) {
            const date = new Date(g.checkedInAt);
            const key = \`\${date.getHours().toString().padStart(2, '0')}:\${date.getMinutes().toString().padStart(2, '0')}h\`;
            if(!statsCheckinTimeline[key]) statsCheckinTimeline[key] = 0;
            statsCheckinTimeline[key]++;
        }
    });

    const statsTimelineData = Object.keys(statsCheckinTimeline).sort().reduce((acc: any, key: string) => {
        const lastCount = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
        acc.push({
            time: key,
            count: statsCheckinTimeline[key],
            cumulative: lastCount + statsCheckinTimeline[key]
        });
        return acc;
    }, []);`,
`    const statsTimelineData = React.useMemo(() => {
        const timeline: any = {};
        statsGuests.forEach(g => {
            if (g.checkedInAt) {
                const date = new Date(g.checkedInAt);
                const key = \`\${date.getHours().toString().padStart(2, '0')}:\${date.getMinutes().toString().padStart(2, '0')}h\`;
                if(!timeline[key]) timeline[key] = 0;
                timeline[key]++;
            }
        });
        return Object.keys(timeline).sort().reduce((acc: any, key: string) => {
            const lastCount = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
            acc.push({
                time: key,
                count: timeline[key],
                cumulative: lastCount + timeline[key]
            });
            return acc;
        }, []);
    }, [statsGuests]);`
);

code = code.replace(
`    // 1. Companions Distribution Chart Data setup
    const companionCategories = {
        alone: 0,
        plusOne: 0,
        plusTwo: 0
    };
    
    statsGuests.forEach(g => {
        if (g.status === 'CONFIRMED') {
            const extra = g.adults ? (g.adults - 1) : 0;
            if (extra === 0) companionCategories.alone++;
            else if (extra === 1) companionCategories.plusOne++;
            else if (extra >= 2) companionCategories.plusTwo++;
        }
    });

    const statsCompanionsData = [
        { name: 'Apenas Próprio', quantidade: companionCategories.alone, fill: '#6366F1' },
        { name: 'Com +1 Extra', quantidade: companionCategories.plusOne, fill: '#3B82F6' },
        { name: 'Com +2 Extras', quantidade: companionCategories.plusTwo, fill: '#06B6D4' }
    ];`,
`    // 1. Companions Distribution Chart Data setup
    const statsCompanionsData = React.useMemo(() => {
        const companionCategories = {
            alone: 0,
            plusOne: 0,
            plusTwo: 0
        };
        statsGuests.forEach(g => {
            if (g.status === 'CONFIRMED') {
                const extra = g.adults ? (g.adults - 1) : 0;
                if (extra === 0) companionCategories.alone++;
                else if (extra === 1) companionCategories.plusOne++;
                else if (extra >= 2) companionCategories.plusTwo++;
            }
        });
        return [
            { name: 'Apenas Próprio', quantidade: companionCategories.alone, fill: '#6366F1' },
            { name: 'Com +1 Extra', quantidade: companionCategories.plusOne, fill: '#3B82F6' },
            { name: 'Com +2 Extras', quantidade: companionCategories.plusTwo, fill: '#06B6D4' }
        ];
    }, [statsGuests]);`
);

fs.writeFileSync('features/dashboard/Dashboard.tsx', code);
console.log('Done timeline memo!');
