/**
 * EventWatch - Production Version
 * Highly optimized for stability with CSV data and cache-busting.
 */

// --- CONFIGURATION ---
const CONFIG = {
    flagsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTVeacJHWwlkad-jQIoR_u_ca1QpkeVoFjXueBikWGo_LPTRd0q4UzWWqqLfw2zqj8DiJ_Paq9EU9Dj/pub?gid=0&single=true&output=csv',
    eventsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSEPoK2b6oFQad7-TbtmOjbN2X2SO_HD7qIXO-7hVBxQkzC7pKM_cpLdyLoDd5LS9knYl-YtqShSydw/pub?gid=0&single=true&output=csv',
    refresh: 15000
};

let state = { 
    flags: { 'EventName': 'පූරණය වෙමින්...', 'EventStatus': 'PENDING' }, 
    events: [] 
};
let statusInterval = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    startDataLoop();
    
    // Modal Setup
    const agendaModal = document.getElementById('agenda-modal');
    const viewAgendaBtn = document.getElementById('view-agenda');
    const closeBtn = document.querySelector('.close-modal');

    if (viewAgendaBtn) viewAgendaBtn.onclick = () => { renderAgenda(); agendaModal.style.display = 'block'; };
    if (closeBtn) closeBtn.onclick = () => agendaModal.style.display = 'none';
    window.onclick = (e) => { if (e.target == agendaModal) agendaModal.style.display = 'none'; };
});

// --- DATA FETCHING ---
async function fetchData() {
    try {
        const bust = (url) => url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
        const [fR, eR] = await Promise.all([
            fetch(bust(CONFIG.flagsUrl)),
            fetch(bust(CONFIG.eventsUrl))
        ]);
        const [fC, eC] = await Promise.all([fR.text(), eR.text()]);
        
        state.flags = parseParams(parseCsv(fC));
        state.events = parseCsv(eC);
        
        render();
    } catch (e) { console.error('Sync Error:', e); }
}

function startDataLoop() {
    fetchData();
    setInterval(fetchData, CONFIG.refresh);
}

// --- RENDERING ---
function render() {
    const f = state.flags;
    
    // Initial reveal transition
    const loadingArea = document.getElementById('loading-area');
    if (loadingArea) loadingArea.remove();
    
    const container = document.querySelector('.container');
    if (container) container.style.justifyContent = 'flex-start';
    
    const header = document.getElementById('main-header');
    if (header) header.style.display = 'block';
    
    const footer = document.getElementById('main-footer');
    if (footer) footer.style.display = 'block';

    const statusSection = document.getElementById('status-section');
    if (statusSection) statusSection.style.display = 'block';

    if (f.EventName) document.getElementById('event-name').textContent = f.EventName;
    if (f.EventSubtext) document.getElementById('event-subtext').textContent = f.EventSubtext;
    
    const rawStatus = f.EventStatus || f['Event status'] || '';
    const status = rawStatus.toUpperCase().trim();
    
    if (status === 'PENDING') {
        document.body.classList.remove('is-live');
        document.getElementById('status-section').style.display = 'block';
        
        const date = f.EventStartDate || f['Event start date'] || '';
        const time = f.EventStartTime || f['Event start time'] || '00:00:00';
        const paddedTime = time.split(':').map(p => p.padStart(2, '0')).join(':');
        
        const target = new Date(`${date}T${paddedTime}`);
        if (isNaN(target.getTime())) {
            document.getElementById('status-container').innerHTML = '<div class="empty-state">දිනය නිවැරදි නැත</div>';
        } else {
            updateCountdown(target);
        }
    } else {
        document.body.classList.add('is-live');
        document.getElementById('status-section').style.display = 'none';
        if (statusInterval) clearInterval(statusInterval);
    }
    renderLists();
}

function updateCountdown(target) {
    const el = document.getElementById('status-container');
    if (statusInterval) clearInterval(statusInterval);
    
    const tick = () => {
        const diff = target - new Date();
        if (diff <= 0) { state.flags.EventStatus = 'ON_GOING'; render(); return; }
        
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff / 3600000) % 24);
        const m = Math.floor((diff / 60000) % 60);
        const s = Math.floor((diff / 1000) % 60);

        el.innerHTML = `
            <div class="status-label">උත්සවය ආරම්භ වීමට තව</div>
            <div id="countdown" class="countdown">
                <div class="countdown-item"><span class="countdown-value">${d}</span><span class="countdown-label">දින</span></div>
                <div class="countdown-item"><span class="countdown-value">${h}</span><span class="countdown-label">පැය</span></div>
                <div class="countdown-item"><span class="countdown-value">${m}</span><span class="countdown-label">මිනිත්තු</span></div>
                <div class="countdown-item"><span class="countdown-value">${s}</span><span class="countdown-label">තත්පර</span></div>
            </div>
        `;
    };
    tick();
    statusInterval = setInterval(tick, 1000);
}

function renderLists() {
    const oList = document.getElementById('ongoing-events-list');
    const uList = document.getElementById('upcoming-events-list');
    const mainView = document.getElementById('events-main-view');
    if (!oList || !uList || !mainView) return;
    
    oList.innerHTML = ''; uList.innerHTML = '';
    
    const rawStatus = state.flags.EventStatus || state.flags['Event status'] || '';
    const status = rawStatus.toUpperCase().trim();

    if (status === 'PENDING') {
        mainView.style.display = 'none';
        return;
    } 
    
    mainView.style.display = 'block';

    state.events.forEach(e => {
        const item = document.createElement('div');
        item.className = 'event-item';
        item.innerHTML = `<div class="event-info"><h3>${e.Event || e.event}</h3><p>${e.Location || e.location}</p></div>`;
        
        const s = (e.Status || e.status || '').toLowerCase().trim();
        if (s === 'on going') oList.appendChild(item);
        else if (s === 'up next') uList.appendChild(item);
    });

    if (!oList.children.length) oList.innerHTML = '<div class="empty-state">දැනට පැවැත්වෙන සිදුවීම් කිසිවක් නැත</div>';
    if (!uList.children.length) uList.innerHTML = '<div class="empty-state">මීලගට සැලසුම් කළ සිදුවීම් කිසිවක් නැත</div>';
}

function renderAgenda() {
    const c = document.getElementById('agenda-content'); if (!c) return;
    const m = { 'Pending': 'මීලගට', 'Up Next': 'මීලගට', 'On Going': 'දැන් පැවැත්වේ', 'Finished': 'නිම විය' };
    c.innerHTML = `<div class="list-centered">${state.events.map(e => {
        const s = (e.Status || e.status || '').toLowerCase().trim().replace(' ', '-');
        return `
            <div class="event-item">
                <div class="event-info">
                    <h3>${e.Event || e.event}</h3>
                    <p>${e.Location || e.location} <span class="event-status status-${s}">${m[e.Status || e.status] || (e.Status || e.status)}</span></p>
                </div>
            </div>`;
    }).join('')}</div>`;
}

// --- UTILS ---
function parseCsv(text) {
    if (!text) return [];
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return headers.reduce((obj, h, i) => { obj[h] = values[i]; return obj; }, {});
    });
}

function parseParams(data) {
    const flags = {};
    data.forEach(row => {
        const keys = Object.keys(row);
        if (keys.length >= 2) {
            const k = row[keys[0]], v = row[keys[1]];
            if (k) flags[k.toString().trim()] = v;
        }
    });
    return flags;
}
