import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

const API_URL = 'http://localhost:3000/api';

async function testTimeLogsV2() {
    console.log('--- Starting Time Logs V2 Verification ---');

    try {
        // 1. Login
        console.log('\n[1] Login as tech1...');
        await client.post(`${API_URL}/auth/login`, {
            username: 'tech1',
            password: 'password123'
        });

        // 2. Get User ID
        const meRes = await client.get(`${API_URL}/auth/me`);
        const techId = meRes.data.user.id;
        console.log('Logged in as Tech ID:', techId);

        // 3. Clock In (Using ID)
        console.log('\n[3] Clocking In...');
        const inRes = await client.post(`${API_URL}/time-logs`, {
            action: 'clock-in',
            technicianId: techId
        });
        console.log('Clock In Result:', inRes.status, inRes.data.timeIn);

        // 4. Fetch Logs
        console.log('\n[4] Fetching Logs...');
        const listRes = await client.get(`${API_URL}/time-logs`);
        const logs = listRes.data;
        console.log('Logs Count:', logs.length);
        console.log('Latest Log Technician:', logs[0]?.technician?.name);

        if (!Array.isArray(logs)) throw new Error('API did not return an array');
        if (!logs[0]?.technician?.name) throw new Error('Technician relation not loaded');

        console.log('\n--- Time Logs V2 Verification SUCCESS ---');

    } catch (error: any) {
        console.error('\n--- Time Logs V2 Verification FAILED ---');
        console.error(error.message);
        if (error.response) console.error(error.response.data);
        process.exit(1);
    }
}

testTimeLogsV2();
