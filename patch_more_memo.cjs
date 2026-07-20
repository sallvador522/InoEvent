const fs = require('fs');
let code = fs.readFileSync('features/dashboard/Dashboard.tsx', 'utf8');

code = code.replace(
`    const confirmedCount = guests.filter(g => g.status === 'CONFIRMED').length;
    const pendingCount = guests.filter(g => g.status === 'PENDING').length;
    const declinedCount = guests.filter(g => g.status === 'DECLINED').length;
    const checkedInCount = guests.filter(g => g.checkedIn).length;
    const totalCount = guests.length;

    const filteredGuests = guests.filter(g => {
        const matchesSearch = g.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              g.phone?.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;
        
        switch (activeFilter) {
            case 'checkedIn': return g.checkedIn === true;
            case 'confirmed': return g.status === 'CONFIRMED';
            case 'pending': return g.status === 'PENDING';
            case 'declined': return g.status === 'DECLINED';
            default: return true;
        }
    });

    const pieData = [
        { name: 'Confirmados', value: confirmedCount, color: '#10B981' },
        { name: 'Pendentes', value: pendingCount, color: '#F59E0B' },
        { name: 'Recusados', value: declinedCount, color: '#EF4444' }
    ].filter(d => d.value > 0);`,
`    const { confirmedCount, pendingCount, declinedCount, checkedInCount, totalCount } = React.useMemo(() => ({
        confirmedCount: guests.filter(g => g.status === 'CONFIRMED').length,
        pendingCount: guests.filter(g => g.status === 'PENDING').length,
        declinedCount: guests.filter(g => g.status === 'DECLINED').length,
        checkedInCount: guests.filter(g => g.checkedIn).length,
        totalCount: guests.length
    }), [guests]);

    const filteredGuests = React.useMemo(() => guests.filter(g => {
        const matchesSearch = g.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              g.phone?.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;
        
        switch (activeFilter) {
            case 'checkedIn': return g.checkedIn === true;
            case 'confirmed': return g.status === 'CONFIRMED';
            case 'pending': return g.status === 'PENDING';
            case 'declined': return g.status === 'DECLINED';
            default: return true;
        }
    }), [guests, searchQuery, activeFilter]);

    const pieData = React.useMemo(() => [
        { name: 'Confirmados', value: confirmedCount, color: '#10B981' },
        { name: 'Pendentes', value: pendingCount, color: '#F59E0B' },
        { name: 'Recusados', value: declinedCount, color: '#EF4444' }
    ].filter(d => d.value > 0), [confirmedCount, pendingCount, declinedCount]);`
);

fs.writeFileSync('features/dashboard/Dashboard.tsx', code);
console.log('Done!');
