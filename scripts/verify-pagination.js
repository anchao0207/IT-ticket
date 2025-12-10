async function verify() {
    console.log('Verifying pagination...');

    // Page 1
    const res1 = await fetch('http://localhost:3000/api/tickets?page=1&limit=10');
    const data1 = await res1.json();
    console.log('Page 1 count:', data1.tickets.length);
    console.log('Page 1 metadata:', JSON.stringify(data1.metadata));

    if (data1.tickets.length !== 10) {
        console.error('FAIL: Page 1 should have 10 tickets');
    }

    // Page 2
    const res2 = await fetch('http://localhost:3000/api/tickets?page=2&limit=10');
    const data2 = await res2.json();
    console.log('Page 2 count:', data2.tickets.length);
    console.log('Page 2 metadata:', JSON.stringify(data2.metadata));

    if (data2.tickets.length === 0) {
        console.error('FAIL: Page 2 should have tickets');
    }

    if (data1.tickets[0].id === data2.tickets[0].id) {
        console.error('FAIL: Page 1 and Page 2 start with same ticket');
    } else {
        console.log('PASS: Pagination seems to work (different tickets on p1 vs p2)');
    }
}

verify();
