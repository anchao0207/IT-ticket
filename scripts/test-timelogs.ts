import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

const API_URL = 'http://localhost:3000/api';

async function testTimeLogs() {
    console.log('--- Testing Time Logs API ---');

    // 1. Create Manual Entry
    console.log('[1] Creating Manual Log for Today...');
    // We assume tech1 exists (id: 1)
    const today = new Date().toISOString().slice(0, 10);
    const start = `${today}T09:00:00`;

    // Since we overwrote POST to handle manual entry
    const res = await client.post(`${API_URL}/time-logs`, {
        adminId: 1,
        date: today,
        timeIn: start
    });
    console.log('Created Log:', res.data.id);
    const logId = res.data.id;

    // 2. Update Log (Lunck Break)
    console.log('[2] Updating Lunch...');
    const lunchStart = `${today}T12:00:00`;
    const lunchEnd = `${today}T12:30:00`;

    await client.put(`${API_URL}/time-logs`, {
        id: logId,
        lunchStart,
        lunchEnd
    });
    console.log('Updated Lunch.');

    // 3. Update Log (End Time)
    console.log('[3] Updating End Time...');
    const end = `${today}T17:00:00`;
    const resUpdate = await client.put(`${API_URL}/time-logs`, {
        id: logId,
        timeOut: end
    });
    console.log('Final Log:', resUpdate.data);

    console.log('--- Success ---');
}

testTimeLogs();
