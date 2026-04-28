/**
 * EventWatch - Production Version
 * Highly optimized for stability with CSV data and cache-busting.
 */

// --- CONFIGURATION ---
const CONFIG = {
    // DEV URLs
    // flagsUrl: 'https://d1rjwubi68tcys.cloudfront.net/spreadsheets/d/1Kn9fKSrXvKeoheT2QITatpOBKel3KCKzTOTtVQAOuxs/export?format=csv&gid=0',
    // eventsUrl: 'https://d1rjwubi68tcys.cloudfront.net/spreadsheets/d/1xYny4WkVy9R5zp8pvih_2iDC43i_k1-MmbCs5DBm-tE/export?format=csv&gid=0',

    // PROD URLs
    flagsUrl: 'https://d1rjwubi68tcys.cloudfront.net/spreadsheets/d/1CFk4ZNrmoAQPJ63biuAPgsNj7IOtv7121AI-Nfc8HyQ/export?format=csv&gid=0',
    eventsUrl: 'https://d1rjwubi68tcys.cloudfront.net/spreadsheets/d/1-FFCVjlh286EsGJxf8bevz6usy9SzznEbZemXQj2Wmg/export?format=csv&gid=0',

    refresh: 15000
};

let state = {
    flags: { 'EventName': 'පූරණය වෙමින්...', 'EventStatus': 'PENDING' },
    events: []
};
let statusInterval = null;

const IS_ADMIN = new URLSearchParams(window.location.search).get('admin') === 'true';
let activeBroadcastEvent = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    startDataLoop();

    // View Navigation (Modal Mode)
    const agendaModal = document.getElementById('agenda-modal');
    const viewAgendaBtn = document.getElementById('view-agenda');
    const closeModalBtn = document.querySelector('.close-modal');

    // Action Menu Modal
    const actionModal = document.getElementById('action-modal');
    const closeActionBtn = document.getElementById('close-action-modal');
    const notifyBtn = document.getElementById('notify-whatsapp-btn');
    const updateBtn = document.getElementById('update-status-btn');

    if (viewAgendaBtn) viewAgendaBtn.onclick = () => {
        renderAgenda();
        agendaModal.style.display = 'flex';
    };

    if (closeModalBtn) closeModalBtn.onclick = () => {
        agendaModal.style.display = 'none';
    };

    if (closeActionBtn) closeActionBtn.onclick = () => {
        actionModal.style.display = 'none';
    };

    notifyBtn?.addEventListener('click', () => {
        if (!activeBroadcastEvent) return;
        const e = activeBroadcastEvent;
        const name = e.Event || e.event || 'නොදනී';
        const loc = (e.Location || e.location || '').trim() || 'ස්ථානය පසුවට දැනුම් දේ';
        const s = (e.Status || e.status || '').toLowerCase().trim();

        let resText = '';
        if (s === 'finished') {
            let places = parseInt(e.Places || e.places || '3', 10);
            if (isNaN(places)) places = 3;

            resText = `🏆 *තරග ප්‍රතිඵල:*\n\n🏃 *තරගය:* ${name}\n`;
            let first = (e['1st'] || '').trim();
            let second = (e['2nd'] || '').trim();
            let third = (e['3rd'] || '').trim();

            if (places === 0) {
                resText += `\nමෙම තරගය සඳහා ජයග්‍රාහකයින් තෝරා නොගැනේ.`;
            } else if (places === 1) {
                first = first || 'තේරී නැත';
                resText += `\n🥇 *ජයග්‍රාහකයා:* ${first}`;
            } else {
                first = first || 'තේරී නැත';
                second = second || 'තේරී නැත';
                third = third || 'තේරී නැත';
                resText += `\n🥇 *ප්‍රථම ස්ථානය:* ${first}`;
                if (places >= 2) resText += `\n🥈 *දෙවන ස්ථානය:* ${second}`;
                if (places >= 3) resText += `\n🥉 *තෙවන ස්ථානය:* ${third}`;
            }
        } else {
            resText = `📢 *දැනුම්දීමයි:*\n\n🏃 *තරගය:* ${name}\n📍 *ස්ථානය:* ${loc}\n\nකරුණාකර අදාල තරගකරුවන් වහාම වාර්තා කරන්න.`;
        }

        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(resText)}`, '_blank');
        actionModal.style.display = 'none';
    });

    updateBtn?.addEventListener('click', () => {
        const editUrl = CONFIG.eventsUrl.replace('/export?format=csv&gid=0', '/edit');
        window.open(editUrl, '_blank');
        actionModal.style.display = 'none';
    });

    window.onclick = (e) => {
        if (e.target == agendaModal) agendaModal.style.display = 'none';
        if (e.target == actionModal) actionModal.style.display = 'none';
    };
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
    const loader = document.getElementById('loading-area');
    if (loader) {
        loader.remove();
        document.querySelector('.container').style.justifyContent = 'flex-start';
        document.getElementById('main-header').style.display = 'block';
        document.getElementById('main-view').style.display = 'block';

        const banner = document.getElementById('main-banner-whatsapp');
        if (banner) banner.style.display = 'flex';

        const ghost = document.getElementById('banner-ghost');
        if (ghost) ghost.style.display = 'block';

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('screen') !== 'true' && urlParams.get('hidefooter') !== 'true') {
            document.getElementById('main-footer').style.display = 'block';
        }
    }

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
        const loc = (e.Location || e.location || '').trim();
        const locationText = loc ? loc : 'ස්ථානය පසුවට දැනුම් දේ';
        item.innerHTML = `<div class="event-info"><h3>${e.Event || e.event}</h3><p>${locationText}</p></div>`;

        const s = (e.Status || e.status || '').toLowerCase().trim();
        if (s === 'on going') oList.appendChild(item);
        else if (s === 'up next') uList.appendChild(item);
    });

    if (!oList.children.length) oList.innerHTML = '<div class="empty-state">දැනට පැවැත්වෙන සිදුවීම් කිසිවක් නැත</div>';
    if (!uList.children.length) uList.innerHTML = '<div class="empty-state">මීලගට සැලසුම් කළ සිදුවීම් කිසිවක් නැත</div>';
}

function renderAgenda() {
    const c = document.getElementById('agenda-content'); if (!c) return;
    const m = { 'Pending': 'පැවැත්වීමට නියමිත', 'Up Next': 'මීලගට', 'On Going': 'දැන් පැවැත්වේ', 'Finished': 'නිම විය' };
    c.innerHTML = `<div class="list-centered">${state.events.map((e, idx) => {
        const s = (e.Status || e.status || '').toLowerCase().trim().replace(' ', '-');
        const loc = (e.Location || e.location || '').trim();
        const locationText = loc ? loc : 'ස්ථානය පසුවට දැනුම් දේ';

        let statusHtml = '';
        if (s === 'finished') {
            statusHtml = `<button class="btn btn-outline btn-results" style="height: 28px; font-size: 0.75rem; padding: 0 1rem; border-radius: 99px; min-height: auto; display: inline-flex; align-items: center; gap: 4px;" data-idx="${idx}">ප්‍රතිඵල <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></button>`;
        } else {
            statusHtml = `<span class="event-status status-${s}">${m[e.Status || e.status] || (e.Status || e.status)}</span>`;
        }

        return `
            <div class="event-item ${IS_ADMIN ? 'admin-clickable' : ''}" data-idx="${idx}">
                <div class="event-info">
                    <h3>${e.Event || e.event}</h3>
                    <div class="location-text-row">${locationText}</div>
                    <div class="agenda-status-row">
                        ${statusHtml}
                    </div>
                    <div id="results-${idx}" class="event-results" style="display: none; margin-top: 1rem; font-size: 0.85rem; text-align: center; background: #f8fafc; padding: 1rem; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05); cursor: default;" onclick="event.stopPropagation()"></div>
                </div>
            </div>`;
    }).join('')}</div>`;

    if (IS_ADMIN) {
        document.querySelectorAll('.admin-clickable').forEach(el => {
            el.onclick = () => {
                activeBroadcastEvent = state.events[el.getAttribute('data-idx')];
                document.getElementById('action-modal').style.display = 'flex';
            };
        });
    }

    document.querySelectorAll('.btn-results').forEach(btn => {
        btn.onclick = (event) => {
            event.stopPropagation();
            const idx = btn.getAttribute('data-idx');
            const resDiv = document.getElementById('results-' + idx);
            if (resDiv.style.display === 'none') {
                resDiv.innerHTML = generateResultsHtml(state.events[idx]);
                resDiv.style.display = 'block';
                btn.innerHTML = `ප්‍රතිඵල <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
            } else {
                resDiv.style.display = 'none';
                btn.innerHTML = `ප්‍රතිඵල <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
            }
        };
    });
}

function generateResultsHtml(e) {
    let places = parseInt(e.Places || e.places || '3', 10);
    if (isNaN(places)) places = 3;

    let first = (e['1st'] || '').trim();
    let second = (e['2nd'] || '').trim();
    let third = (e['3rd'] || '').trim();

    if (places === 0) {
        return `<div style="color: var(--text-muted); font-style: italic; text-align: center;">මෙම තරගය සඳහා ජයග්‍රාහකයින් තෝරා නොගැනේ.</div>`;
    } else if (places === 1) {
        return `<div style="font-weight: 700; color: #16a34a; text-align: center;">🥇 ජයග්‍රාහකයා: <span style="color: var(--text-main); font-weight: 600;">${first || 'තේරී නැත'}</span></div>`;
    } else {
        let html = `<div style="font-weight: 700; color: #16a34a; margin-bottom: 0.25rem;">🥇 ප්‍රථම ස්ථානය: <span style="color: var(--text-main); font-weight: 600;">${first || 'තේරී නැත'}</span></div>`;
        if (places >= 2) html += `<div style="font-weight: 700; color: #2563eb; margin-bottom: 0.25rem;">🥈 දෙවන ස්ථානය: <span style="color: var(--text-main); font-weight: 600;">${second || 'තේරී නැත'}</span></div>`;
        if (places >= 3) html += `<div style="font-weight: 700; color: #ca8a04;">🥉 තෙවන ස්ථානය: <span style="color: var(--text-main); font-weight: 600;">${third || 'තේරී නැත'}</span></div>`;
        return html;
    }
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
