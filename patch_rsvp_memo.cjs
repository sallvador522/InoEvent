const fs = require('fs');
let code = fs.readFileSync('features/dashboard/Dashboard.tsx', 'utf8');

code = code.replace(
`    // 2. RSVP Cumulative Registration Day-by-day Chart Data
    const rsvpDailyTimeline: { [key: string]: number } = {};
    statsGuests.forEach(g => {
        const rawDate = g.createdAt || g.updatedAt;
        if (rawDate) {
            try {
                const date = new Date(rawDate);
                const dayMonthKey = \`\${date.getDate().toString().padStart(2, '0')}/\${(date.getMonth() + 1).toString().padStart(2, '0')}\`;
                if (!rsvpDailyTimeline[dayMonthKey]) {
                    rsvpDailyTimeline[dayMonthKey] = 0;
                }
                // Count how many confirmed/declined on this day
                rsvpDailyTimeline[dayMonthKey]++;
            } catch (err) {
                // Ignore invalid date strings
            }
        }
    });

    // Sort timeline keys lexicographically
    const sortedRsvpDates = Object.keys(rsvpDailyTimeline).sort((a, b) => {
        const [dayA, monthA] = a.split('/').map(Number);
        const [dayB, monthB] = b.split('/').map(Number);
        return monthA === monthB ? dayA - dayB : monthA - monthB;
    });

    const statsRsvpGrowthData = sortedRsvpDates.reduce((acc: any[], dateKey) => {
        const dailyCount = rsvpDailyTimeline[dateKey];
        const lastCumulative = acc.length > 0 ? acc[acc.length - 1].acumulado : 0;
        acc.push({
            data: dateKey,
            contagem: dailyCount,
            acumulado: lastCumulative + dailyCount
        });
        return acc;
    }, []);`,
`    // 2. RSVP Cumulative Registration Day-by-day Chart Data
    const statsRsvpGrowthData = React.useMemo(() => {
        const rsvpDailyTimeline: { [key: string]: number } = {};
        statsGuests.forEach(g => {
            const rawDate = g.createdAt || g.updatedAt;
            if (rawDate) {
                try {
                    const date = new Date(rawDate);
                    const dayMonthKey = \`\${date.getDate().toString().padStart(2, '0')}/\${(date.getMonth() + 1).toString().padStart(2, '0')}\`;
                    if (!rsvpDailyTimeline[dayMonthKey]) {
                        rsvpDailyTimeline[dayMonthKey] = 0;
                    }
                    // Count how many confirmed/declined on this day
                    rsvpDailyTimeline[dayMonthKey]++;
                } catch (err) {
                    // Ignore invalid date strings
                }
            }
        });

        const sortedRsvpDates = Object.keys(rsvpDailyTimeline).sort((a, b) => {
            const [dayA, monthA] = a.split('/').map(Number);
            const [dayB, monthB] = b.split('/').map(Number);
            return monthA === monthB ? dayA - dayB : monthA - monthB;
        });

        return sortedRsvpDates.reduce((acc: any[], dateKey) => {
            const dailyCount = rsvpDailyTimeline[dateKey];
            const lastCumulative = acc.length > 0 ? acc[acc.length - 1].acumulado : 0;
            acc.push({
                data: dateKey,
                contagem: dailyCount,
                acumulado: lastCumulative + dailyCount
            });
            return acc;
        }, []);
    }, [statsGuests]);`
);

fs.writeFileSync('features/dashboard/Dashboard.tsx', code);
console.log('Done rsvp memo!');
