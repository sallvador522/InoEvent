import { exec } from 'child_process';
const child = exec('node dist/server.cjs');
child.stdout.on('data', data => console.log('STDOUT:', data));
child.stderr.on('data', data => console.log('STDERR:', data));
setTimeout(async () => {
    try {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch('http://localhost:3000/invite/evt_dtoo3leoz');
        const text = await res.text();
        const match = text.match(/<meta property="og:title"[^>]*>/);
        console.log("Found tag:", match ? match[0] : "None");
    } catch(e) {
        console.error(e);
    }
    child.kill();
    process.exit(0);
}, 3000);
