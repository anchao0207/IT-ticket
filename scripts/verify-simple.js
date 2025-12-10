async function verify() {
    try {
        const res = await fetch('http://localhost:3000/api/tickets?page=1&limit=2');
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body start:', text.substring(0, 1000));
    } catch (e) {
        console.error('Error:', e);
    }
}
verify();
