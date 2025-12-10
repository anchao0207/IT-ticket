import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

const API_URL = 'http://localhost:3000/api';

async function testPhase2() {
    console.log('--- Starting Phase 2 Verification ---');

    try {
        // 1. Login
        console.log('\n[1] Login as tech1...');
        const loginRes = await client.post(`${API_URL}/auth/login`, {
            username: 'tech1',
            password: 'password123'
        });
        console.log('Login Status:', loginRes.status, loginRes.data);
        if (!loginRes.data.success) throw new Error('Login failed');

        // 2. Check Session
        console.log('\n[2] Checking Session (Me)...');
        const meRes = await client.get(`${API_URL}/auth/me`);
        console.log('Current User:', meRes.data.user?.username);
        if (meRes.data.user?.username !== 'tech1') throw new Error('Session check failed');

        // 3. Create Ticket (as tech1)
        console.log('\n[3] Creating Ticket...');
        const ticketRes = await client.post(`${API_URL}/tickets`, {
            company: 'Auth Test Corp',
            admin: 'Admin',
            location: 'Server Room',
            person: 'Auth User',
            issue: 'Login Test Issue',
            startedTime: new Date().toISOString()
        });
        const ticketId = ticketRes.data.id;
        console.log('Ticket Created:', ticketId);

        // 4. Assign Ticket to Self (using PUT with technicianId implicitly from current user? 
        //    Actually API requires passing ID in body for now per my implementation, 
        //    but UI passes its own user ID. Let's pass it.)
        console.log('\n[4] Assigning Ticket...');
        const assignRes = await client.put(`${API_URL}/tickets`, {
            id: ticketId,
            status: 'Assigned',
            technicianId: meRes.data.user.id
        });
        console.log('Ticket Assigned to:', assignRes.data.technician?.username);

        if (assignRes.data.technician?.username !== 'tech1') throw new Error('Assignment failed');

        console.log('\n--- Phase 2 Verification SUCCESS ---');

    } catch (error: any) {
        console.error('\n--- Phase 2 Verification FAILED ---');
        console.error(error.message);
        if (error.response) console.error(error.response.data);
        process.exit(1);
    }
}

testPhase2();
