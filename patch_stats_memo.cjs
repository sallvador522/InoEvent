const fs = require('fs');
let code = fs.readFileSync('features/dashboard/Dashboard.tsx', 'utf8');

code = code.replace(
`    // Reactive stats computations
    const statsGuests = guests.filter(g => {
        if (statsPeriodFilter !== 'all') {
            if (!g.createdAt) return false;
            const date = new Date(g.createdAt);
            const now = new Date();
            const msDiff = now.getTime() - date.getTime();
            const daysDiff = msDiff / (1000 * 60 * 60 * 24);
            if (statsPeriodFilter === '24h' && daysDiff > 1) return false;
            if (statsPeriodFilter === '7d' && daysDiff > 7) return false;
            if (statsPeriodFilter === '30d' && daysDiff > 30) return false;
        }
        if (statsSubgroupFilter === 'adults') {
            const adCount = g.adults !== undefined ? g.adults : 1;
            if (adCount <= 0) return false;
        }
        if (statsSubgroupFilter === 'children') {
            const chCount = g.children !== undefined ? g.children : 0;
            if (chCount <= 0) return false;
        }
        return true;
    });`,
`    // Reactive stats computations
    const statsGuests = React.useMemo(() => guests.filter(g => {
        if (statsPeriodFilter !== 'all') {
            if (!g.createdAt) return false;
            const date = new Date(g.createdAt);
            const now = new Date();
            const msDiff = now.getTime() - date.getTime();
            const daysDiff = msDiff / (1000 * 60 * 60 * 24);
            if (statsPeriodFilter === '24h' && daysDiff > 1) return false;
            if (statsPeriodFilter === '7d' && daysDiff > 7) return false;
            if (statsPeriodFilter === '30d' && daysDiff > 30) return false;
        }
        if (statsSubgroupFilter === 'adults') {
            const adCount = g.adults !== undefined ? g.adults : 1;
            if (adCount <= 0) return false;
        }
        if (statsSubgroupFilter === 'children') {
            const chCount = g.children !== undefined ? g.children : 0;
            if (chCount <= 0) return false;
        }
        return true;
    }), [guests, statsPeriodFilter, statsSubgroupFilter]);`
);

code = code.replace(
`    const statsConfirmedCount = statsGuests.filter(g => g.status === 'CONFIRMED').length;
    const statsPendingCount = statsGuests.filter(g => g.status === 'PENDING').length;
    const statsDeclinedCount = statsGuests.filter(g => g.status === 'DECLINED').length;
    const statsCheckedInCount = statsGuests.filter(g => g.checkedIn).length;
    const statsTotalCount = statsGuests.length;

    const statsPieData = [
        { name: 'Confirmados', value: statsConfirmedCount, color: '#10B981' },
        { name: 'Pendentes', value: statsPendingCount, color: '#F59E0B' },
        { name: 'Recusados', value: statsDeclinedCount, color: '#EF4444' }
    ].filter(d => d.value > 0);`,
`    const { statsConfirmedCount, statsPendingCount, statsDeclinedCount, statsCheckedInCount, statsTotalCount } = React.useMemo(() => ({
        statsConfirmedCount: statsGuests.filter(g => g.status === 'CONFIRMED').length,
        statsPendingCount: statsGuests.filter(g => g.status === 'PENDING').length,
        statsDeclinedCount: statsGuests.filter(g => g.status === 'DECLINED').length,
        statsCheckedInCount: statsGuests.filter(g => g.checkedIn).length,
        statsTotalCount: statsGuests.length
    }), [statsGuests]);

    const statsPieData = React.useMemo(() => [
        { name: 'Confirmados', value: statsConfirmedCount, color: '#10B981' },
        { name: 'Pendentes', value: statsPendingCount, color: '#F59E0B' },
        { name: 'Recusados', value: statsDeclinedCount, color: '#EF4444' }
    ].filter(d => d.value > 0), [statsConfirmedCount, statsPendingCount, statsDeclinedCount]);`
);

fs.writeFileSync('features/dashboard/Dashboard.tsx', code);
console.log('Done stats memo!');
