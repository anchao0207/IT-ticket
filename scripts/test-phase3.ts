import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

const API_URL = 'http://localhost:3000/api';

async function testPhase3() {
    console.log('--- Starting Phase 3 Verification (Enhanced Edit) ---');

    try {
        // 1. Login
        console.log('\n[1] Login as tech1...');
        await client.post(`${API_URL}/auth/login`, {
            username: 'tech1',
            password: 'password123'
        });

        // 2. Create Ticket
        console.log('\n[2] Creating Ticket...');
        const ticketRes = await client.post(`${API_URL}/tickets`, {
            company: 'Original Inc',
            admin: 'Admin1',
            location: 'remote',
            person: 'Person1',
            issue: 'Initial Issue',
            startedTime: new Date().toISOString()
        });
        const ticketId = ticketRes.data.id;
        console.log('Ticket Created:', ticketId);

        // 3. Edit Ticket (Full Update)
        console.log('\n[3] Editing Ticket (Full Details)...');
        const newDate = new Date();
        newDate.setFullYear(2026); // Future date test

        const editRes = await client.put(`${API_URL}/tickets`, {
            id: ticketId,
            company: 'Updated Corp',
            admin: 'Admin2',
            location: 'on-site',
            person: 'Person2',
            issue: 'Updated Issue',
            startedTime: newDate.toISOString(),
            status: 'In Progress'
        });

        // 4. Verify Update
        console.log('\n[4] Verifying Update...');
        const updatedTicket = editRes.data;

        console.log('Company:', updatedTicket.company);
        console.log('Location:', updatedTicket.location);
        console.log('Status:', updatedTicket.status);

        if (updatedTicket.company !== 'Updated Corp') throw new Error('Company not updated');
        if (updatedTicket.location !== 'on-site') throw new Error('Location not updated');
        if (updatedTicket.person !== 'Person2') throw new Error('Person not updated');

        console.log('\n--- Phase 3 Verification SUCCESS ---');

    } catch (error: any) {
        console.error('\n--- Phase 3 Verification FAILED ---');
        console.error(error.message);
        if (error.response) console.error(error.response.data);
        process.exit(1);
    }
}

testPhase3();
