const fs = require('fs');

async function testExport() {
    const adminEmail = 'admin@dsignxt.com';
    const adminPassword = 'admin123';
    const baseUrl = 'http://localhost:3000';

    console.log('--- Testing Student Export ---');

    // 1. Authenticate
    console.log('Logging in...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });

    if (!loginRes.ok) {
        console.error('Login failed');
        return;
    }

    // Extract token from cookie header manually or rely on fetch cookie handling if environment supports it?
    // Node fetch doesn't handle cookies automatically.
    // We need to parse 'set-cookie' and pass it.
    const cookies = loginRes.headers.get('set-cookie');
    if (!cookies) {
        console.error('No cookies received');
        return;
    }
    const token = cookies.split(';')[0];
    console.log('Login successful. Token cookie:', token);

    const headers = {
        'Cookie': token
    };

    // 2. Test CSV Export
    console.log('\nTesting CSV Export...');
    const csvRes = await fetch(`${baseUrl}/api/admin/students/export?format=csv&status=Active`, { headers });

    if (csvRes.ok) {
        const text = await csvRes.text();
        console.log('CSV Status:', csvRes.status);
        console.log('CSV Content-Type:', csvRes.headers.get('content-type'));
        console.log('CSV Preview:\n', text.substring(0, 300));
        if (text.includes('Student ID') && text.includes('Full Name')) {
            console.log('✅ CSV Content Verified');
        } else {
            console.error('❌ CSV Content Invalid');
        }
    } else {
        console.error('❌ CSV Export Failed:', csvRes.status, await csvRes.text());
    }

    // 3. Test Excel Export
    console.log('\nTesting Excel Export...');
    const xlsxRes = await fetch(`${baseUrl}/api/admin/students/export?format=xlsx`, { headers });

    if (xlsxRes.ok) {
        const buffer = await xlsxRes.arrayBuffer();
        console.log('Excel Status:', xlsxRes.status);
        console.log('Excel Content-Type:', xlsxRes.headers.get('content-type'));
        console.log('Excel Size:', buffer.byteLength, 'bytes');
        if (buffer.byteLength > 0) {
            console.log('✅ Excel Download Verified (Buffer received)');
        } else {
            console.error('❌ Excel Buffer Empty');
        }
    } else {
        console.error('❌ Excel Export Failed:', xlsxRes.status, await xlsxRes.text());
    }
}

testExport();
