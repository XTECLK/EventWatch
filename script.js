/**
 * EventWatch Logic
 * Minimalist script for managing event state and content.
 */

// --- CONFIGURATION ---
const CONFIG = {
    // These will be replaced with real CSV URLs later
    flagsCsvUrl: null, 
    eventsCsvUrl: null,
    refreshInterval: 20000, // 20 seconds
    placeholderBg: 'assets/hero-bg.png'
};

// --- DUMMY DATA ---
const dummyFlags = {
    'Event name': 'සූර්ය මංගල්‍යය 2026',
    'Event subtext': 'ගමේ හැමෝම එකතු වෙන අපේ දවස',
    'Event start date': '2026-05-02',
    'Event start time': '07:00:00',
    'Event status': 'PENDING', // PENDING, ON_GOING, PAUSED_FOR_LUNCH, ENDED
    'WhatsApp link': 'https://chat.whatsapp.com/test'
};

const dummyEvents = [
    { Event: 'කිරි ඉතිරවීම', Location: 'ප්‍රධාන ලිප අසල', Status: 'Finished' },
    { Event: 'අවුරුදු කෑම මේසය', Location: 'භෝජන ශාලාව', Status: 'On Going' },
    { Event: 'ජන ක්‍රීඩා ආරම්භය', Location: 'ක්‍රීඩා පිටිය', Status: 'Up Next' },
    { Event: 'සංගීත ප්‍රසංගය', Location: 'ප්‍රධාන වේදිකාව', Status: 'Pending' },
    { Event: 'සන් ක්‍රීඩා අංශය', Location: 'වෙල් යාය', Status: 'Pending' }
];

// --- APP STATE ---
let currentState = {
    flags: dummyFlags,
    events: dummyEvents,
    countdownTimer: null
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    renderContent();
    setupEventListeners();
    startDataLoop();
}

function setupEventListeners() {
    const modal = document.getElementById('agenda-modal');
    const btn = document.getElementById('view-agenda');
    const span = document.querySelector('.close-modal');

    btn.onclick = () => {
        renderAgenda();
        modal.style.display = "block";
    };

    span.onclick = () => {
        modal.style.display = "none";
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}

// --- DATA FETCHING ---
function startDataLoop() {
    // In a real scenario, this would fetch from CSV
    // for now we just use dummy data
    setInterval(() => {
        console.log('Refreshing data...');
        // fetchFromCsv();
    }, CONFIG.refreshInterval);
}

// --- RENDERING ---
function renderContent() {
    const { flags } = currentState;

    // Header
    document.getElementById('event-name').textContent = flags['Event name'];
    document.getElementById('event-subtext').textContent = flags['Event subtext'];
    document.getElementById('whatsapp-link').href = flags['WhatsApp link'];

    // Status Section
    renderStatus();

    // Events List
    renderEvents();
}

function renderStatus() {
    const container = document.getElementById('status-container');
    const status = currentState.flags['Event status'];
    
    clearInterval(currentState.countdownTimer);

    if (status === 'PENDING') {
        const targetDate = new Date(`${currentState.flags['Event start date']}T${currentState.flags['Event start time']}`);
        container.innerHTML = `
            <div class="status-label">උත්සවය ආරම්භ වීමට තව</div>
            <div id="countdown" class="countdown"></div>
        `;
        startCountdown(targetDate);
    } 
    else if (status === 'ON_GOING') {
        container.innerHTML = `
            <div class="live-badge"><span class="dot"></span> සජීවීව</div>
            <h2 style="font-size: 1.5rem;">සිදුවීම් දැනට ක්‍රියාත්මකයි</h2>
            <p style="color: var(--text-muted); margin-top: 0.5rem;">අළුත්ම යාවත්කාලීන සඳහා රැඳී සිටින්න</p>
        `;
    }
    else if (status === 'PAUSED_FOR_LUNCH') {
        container.innerHTML = `
            <div class="live-badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;">
                විවේක කාලය
            </div>
            <h2 style="font-size: 1.5rem;">දවල් ආහාරය සඳහා විරාමය</h2>
            <p style="color: var(--text-muted); margin-top: 0.5rem;">මඳ වේලාවකින් නැවත ආරම්භ වේ</p>
        `;
    }
    else if (status === 'ENDED') {
        container.innerHTML = `
            <h2 style="font-size: 1.5rem;">උත්සවය නිම විය</h2>
            <p style="color: var(--text-muted); margin-top: 0.5rem;">සම්බන්ධ වූ සැමට ස්තූතියි!</p>
        `;
    }
}

function startCountdown(target) {
    const countdownEl = document.getElementById('countdown');
    
    const update = () => {
        const now = new Date();
        const diff = target - now;

        if (diff <= 0) {
            clearInterval(currentState.countdownTimer);
            currentState.flags['Event status'] = 'ON_GOING';
            renderStatus();
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        const secs = Math.floor((diff / 1000) % 60);

        countdownEl.innerHTML = `
            <div class="countdown-item">
                <span class="countdown-value">${days}</span>
                <span class="countdown-label">දින</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-value">${hours}</span>
                <span class="countdown-label">පැය</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-value">${mins}</span>
                <span class="countdown-label">මිනිත්තු</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-value">${secs}</span>
                <span class="countdown-label">තත්පර</span>
            </div>
        `;
    };

    update();
    currentState.countdownTimer = setInterval(update, 1000);
}

function renderEvents() {
    const ongoingList = document.getElementById('ongoing-events-list');
    const upcomingList = document.getElementById('upcoming-events-list');
    
    ongoingList.innerHTML = '';
    upcomingList.innerHTML = '';

    const statusMap = {
        'Pending': 'ඉදිරියට',
        'Up Next': 'මීළඟට',
        'On Going': 'දැනට පැවැත්වේ',
        'Finished': 'නිම විය'
    };

    currentState.events.forEach(event => {
        const item = document.createElement('div');
        item.className = 'event-item';
        item.innerHTML = `
            <div class="event-info">
                <h3>${event.Event}</h3>
                <p>${event.Location}</p>
            </div>
            <div class="event-status status-${event.Status.toLowerCase().replace(' ', '-')}">${statusMap[event.Event] || statusMap[event.Status] || event.Status}</div>
        `;

        if (event.Status === 'On Going') {
            ongoingList.appendChild(item);
        } else if (event.Status === 'Pending' || event.Status === 'Up Next') {
            upcomingList.appendChild(item);
        }
    });

    // Hide sections if empty
    document.getElementById('ongoing-section').style.display = ongoingList.children.length > 0 ? 'block' : 'none';
}

function renderAgenda() {
    const content = document.getElementById('agenda-content');
    content.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
            <thead>
                <tr style="text-align: left; border-bottom: 1px solid var(--glass-border);">
                    <th style="padding: 0.5rem;">වේලාව</th>
                    <th style="padding: 0.5rem;">සිදුවීම</th>
                </tr>
            </thead>
            <tbody>
                ${currentState.events.map(e => `
                    <tr style="border-bottom: 1px solid var(--glass-border);">
                        <td style="padding: 0.75rem; font-size: 0.9rem;">${e.Status === 'සම්පූර්ණයි' ? 'නිම විය' : 'ඉදිරියට'}</td>
                        <td style="padding: 0.75rem;">
                            <div style="font-weight: 500;">${e.Event}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${e.Location}</div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// --- UTILS ---
function parseCsv(text) {
    // Simple CSV parser
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header.trim()] = values[index]?.trim();
            return obj;
        }, {});
    });
}
