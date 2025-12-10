async function verify() {
    console.log('Testing GET...');
    const resGet = await fetch('http://localhost:3000/api/tickets?page=1&limit=1');
    console.log('GET Status:', resGet.status);
    console.log('GET Content-Type:', resGet.headers.get('content-type'));
    const textGet = await resGet.text();
    console.log('GET Body start:', textGet.substring(0, 100));

    console.log('Testing POST...');
    const ticket = {
        company: 'Test Verify',
        issue: 'Verify POST',
        status: 'Open',
        startedTime: new Date().toISOString(),
        person: 'Tester',
        location: 'Lab'
    };
    const resPost = await fetch('http://localhost:3000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket)
    });
    console.log('POST Status:', resPost.status);
    console.log('POST Content-Type:', resPost.headers.get('content-type'));
    const textPost = await resPost.text();
    console.log('POST Body start:', textPost.substring(0, 100));
}
verify();
