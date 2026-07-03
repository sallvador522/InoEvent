import fetch from 'node-fetch';
setTimeout(async () => {
    try {
        const res = await fetch('http://localhost:3000/invite/evt_dtoo3leoz');
        const text = await res.text();
        console.log("HTML length:", text.length);
        const match = text.match(/<meta property="og:title"[^>]*>/);
        console.log("Found tag:", match ? match[0] : "None");
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}, 3000);
