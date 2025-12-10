import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

const API_URL = 'http://localhost:3000/api';

async function testPhase4() {
    console.log('--- Starting Phase 4 Verification (Time End & Calc) ---');

    try {
        // 0. Login
        console.log('[0] Logging in as tech1...');
        await client.post(`${API_URL}/auth/login`, {
            username: 'tech1',
            password: 'password123'
        });
        console.log('Logged in successfully.');

        // 1. Create Ticket with known start time
        const startTime = new Date();
        startTime.setHours(9, 0, 0, 0); // 9:00 AM

        console.log('[1] Creating Ticket...');
        const ticketRes = await client.post(`${API_URL}/tickets`, {
            company: 'Time Corp',
            location: 'remote',
            person: 'Person',
            issue: 'Time Test',
            startedTime: startTime.toISOString()
        });

        // Check if ID exists
        const ticketId = ticketRes.data.id;
        if (!ticketId) {
            console.error('Create Response Body:', ticketRes.data);
            throw new Error('Failed to create ticket: No ID returned');
        }

        console.log('Ticket Created:', ticketId);

        // 2. Update with End Time (2.5 hours later)
        const endTime = new Date(startTime);
        endTime.setHours(11, 30, 0, 0); // 11:30 AM

        console.log('\n[2] Setting End Time to 11:30 AM (Start: 9:00 AM)...');
        const updateRes = await client.put(`${API_URL}/tickets`, {
            id: ticketId,
            timeEnd: endTime.toISOString()
        });

        // 3. Verify Total Time
        console.log('\n[3] Verifying Calculation...');
        const updatedTicket = updateRes.data;
        console.log('Total Time (Hours):', updatedTicket.totalTime);

        // Expected: 2.5 hours
        if (updatedTicket.totalTime !== 2.5) {
            throw new Error(`Expected 2.5 hours, got ${updatedTicket.totalTime}`);
        }

        console.log('\n--- Phase 4 Verification SUCCESS ---');

    } catch (error: any) {
        console.error('\n--- Phase 4 Verification FAILED ---');
        console.error(error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
        process.exit(1);
    }
}

testPhase4();
