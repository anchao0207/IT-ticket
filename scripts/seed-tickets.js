// using global fetch available in Node 18+
// Since we don't know the node version, let's use http module or assume fetch is available (Node 18+).
// Let's try to use standard http to be safe or just assume fetch is there.
// Actually, simple curl loop in shell might be easier.
// But let's write a small node script using native fetch (Node 18+)
// If it fails, we fall back.

async function seed() {
    console.log('Seeding tickets...');
    const statuses = ['Open', 'In Progress', 'Unassigned', 'Completed'];
    for (let i = 1; i <= 15; i++) {
        const ticket = {
            company: `Company ${i}`,
            issue: `Issue ${i} - Pagination Test`,
            status: statuses[i % 4],
            startedTime: new Date().toISOString(),
            person: `User ${i}`,
            location: `Location ${i}`,
            adminId: i % 2 === 0 ? '1' : '', // Assign some to admin 1
        };

        try {
            const res = await fetch('http://localhost:3000/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ticket),
            });
            if (res.ok) {
                console.log(`Created ticket ${i}`);
            } else {
                console.error(`Failed to create ticket ${i}:`, await res.text());
            }
        } catch (e) {
            console.error(`Error creating ticket ${i}:`, e);
        }
    }
    console.log('Done seeding.');
}

seed();
