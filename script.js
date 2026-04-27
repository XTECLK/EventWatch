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
    'Event status': 'ON_GOING', // PENDING, ON_GOING, PAUSED_FOR_LUNCH, ENDED
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
    // Header Sync (Both Fixed and Ghost for perfect offset)
    const { flags } = currentState;
    const nameEls = [document.getElementById('event-name'), document.getElementById('event-name-ghost')];
    const subtextEls = [document.getElementById('event-subtext'), document.getElementById('event-subtext-ghost')];
    const whatsappLink = document.getElementById('whatsapp-link');

    nameEls.forEach(el => { if (el) el.textContent = flags['Event name']; });
    subtextEls.forEach(el => { if (el) el.textContent = flags['Event subtext']; });
    whatsappLink.href = flags['WhatsApp link'];

    // Status Section
    renderStatus();

    // Events List
    renderEvents();
}


function renderStatus() {
    const section = document.getElementById('status-section');
    const container = document.getElementById('status-container');
    const status = currentState.flags['Event status'];
    
    clearInterval(currentState.countdownTimer);

    if (status === 'PENDING') {
        document.body.classList.remove('is-live');
        section.style.display = 'block';
        const targetDate = new Date(`${currentState.flags['Event start date']}T${currentState.flags['Event start time']}`);
        container.innerHTML = `
            <div class="status-label">උත්සවය ආරම්භ වීමට තව</div>
            <div id="countdown" class="countdown"></div>
        `;
        startCountdown(targetDate);
    } 
    else {
        document.body.classList.add('is-live');
        // Hide the status section entirely when live or finished, 
        // as the tabs/content now convey everything.
        section.style.display = 'none';
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
    const ongoingSection = document.getElementById('ongoing-section');
    const upcomingSection = document.getElementById('upcoming-section');
    const ongoingList = document.getElementById('ongoing-events-list');
    const upcomingList = document.getElementById('upcoming-events-list');
    const status = currentState.flags['Event status'];

    ongoingList.innerHTML = '';
    upcomingList.innerHTML = '';

    // Hide events if pending
    if (status === 'PENDING') {
        ongoingSection.style.display = 'none';
        upcomingSection.style.display = 'none';
        return;
    } else {
        ongoingSection.style.display = 'block';
        upcomingSection.style.display = 'block';
    }

    const statusMap = {
        'Pending': 'මීලගට',
        'Up Next': 'මීලගට',
        'On Going': 'දැන් පැවැත්වේ',
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
        `;

        const s = event.Status.toLowerCase().trim();
        if (s === 'on going') {
            ongoingList.appendChild(item);
        } else if (s === 'pending' || s === 'up next') {
            upcomingList.appendChild(item);
        }
    });

    // Ensure sections are visible if we started the live phase
}

function renderAgenda() {
    const content = document.getElementById('agenda-content');

    const statusMap = {
        'Pending': 'මීලගට',
        'Up Next': 'මීලගට',
        'On Going': 'දැන් පැවැත්වේ',
        'Finished': 'නිම විය'
    };

    content.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
            <thead>
                <tr style="text-align: left; border-bottom: 1px solid var(--glass-border);">
                    <th style="padding: 0.5rem;">සිදුවීම</th>
                    <th style="padding: 0.5rem; text-align: right;">තත්ත්වය</th>
                </tr>
            </thead>
            <tbody>
                ${currentState.events.map(e => `
                    <tr style="border-bottom: 1px solid var(--glass-border);">
                        <td style="padding: 1rem 0.5rem;">
                            <div style="font-weight: 600;">${e.Event}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${e.Location}</div>
                        </td>
                        <td style="padding: 1rem 0.5rem; text-align: right; vertical-align: middle;">
                            <span class="event-status status-${e.Status.toLowerCase().replace(' ', '-')}">
                                ${statusMap[e.Status] || e.Status}
                            </span>
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
