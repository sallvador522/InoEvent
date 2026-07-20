const fs = require('fs');
let code = fs.readFileSync('features/dashboard/Dashboard.tsx', 'utf8');

code = code.replace(
`    const checkinTimeline: any = {};
    guests.forEach(g => {
        if (g.checkedInAt) {
            const date = new Date(g.checkedInAt);
            const key = \`\${date.getHours().toString().padStart(2, '0')}:\${date.getMinutes().toString().padStart(2, '0')}h\`;
            if(!checkinTimeline[key]) checkinTimeline[key] = 0;
            checkinTimeline[key]++;
        }
    });

    const timelineData = Object.keys(checkinTimeline).sort().reduce((acc: any, key: string) => {
        const lastCount = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
        acc.push({
            time: key,
            count: checkinTimeline[key],
            cumulative: lastCount + checkinTimeline[key]
        });
        return acc;
    }, []);`,
`    const timelineData = React.useMemo(() => {
        const checkinTimeline: any = {};
        guests.forEach(g => {
            if (g.checkedInAt) {
                const date = new Date(g.checkedInAt);
                const key = \`\${date.getHours().toString().padStart(2, '0')}:\${date.getMinutes().toString().padStart(2, '0')}h\`;
                if(!checkinTimeline[key]) checkinTimeline[key] = 0;
                checkinTimeline[key]++;
            }
        });

        return Object.keys(checkinTimeline).sort().reduce((acc: any, key: string) => {
            const lastCount = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
            acc.push({
                time: key,
                count: checkinTimeline[key],
                cumulative: lastCount + checkinTimeline[key]
            });
            return acc;
        }, []);
    }, [guests]);`
);

fs.writeFileSync('features/dashboard/Dashboard.tsx', code);
console.log('Done!');
