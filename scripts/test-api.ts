import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testFlow() {
    console.log('--- Starting API Verification Flow ---');

    try {
        // 1. Create Ticket
        console.log('\n[1] Creating Ticket...');
        const ticketRes = await axios.post(`${API_URL}/tickets`, {
            company: 'Test Corp',
            admin: 'Admin User',
            location: 'Test Lab',
            person: 'Jane Doe',
            issue: 'Initial Test Issue',
            startedTime: new Date().toISOString()
        });
        console.log('Ticket Created:', ticketRes.data.id, ticketRes.data.status);
        const ticketId = ticketRes.data.id;

        // 2. Assign Ticket
        console.log('\n[2] Assigning Ticket to Technician...');
        const updateRes = await axios.put(`${API_URL}/tickets`, {
            id: ticketId,
            status: 'Assigned',
            technician: 'Tech1'
        });
        console.log('Ticket Updated:', updateRes.data.status, updateRes.data.comments);

        // 3. Clock In
        console.log('\n[3] Clocking In Technician...');
        const clockInRes = await axios.post(`${API_URL}/time-logs`, {
            technician: 'Tech1',
            action: 'clock-in'
        });
        console.log('Clock In Success:', clockInRes.data.timeIn);

        // 4. Clock Out
        console.log('\n[4] Clocking Out Technician...');
        const clockOutRes = await axios.post(`${API_URL}/time-logs`, {
            technician: 'Tech1',
            action: 'clock-out'
        });
        console.log('Clock Out Success:', clockOutRes.data.timeOut);

        console.log('\n--- Verification SUCCESS ---');

    } catch (error: any) {
        console.error('\n--- Verification FAILED ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

testFlow();
