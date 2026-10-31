/**
 * EventWatch frontend config. The settings live in `.eventwatch/app.json`
 * (written by `npm run setup`); this file just loads them.
 *
 *   sheetId    Google Sheet to read (must be shared "Anyone with the link: Viewer")
 *   flagsTab   tab name for key/value settings   (default "Flags")
 *   eventsTab  tab name for the events table     (default "Events")
 *   refresh    milliseconds between refreshes    (default 15000)
 */
const CONFIG = { refresh: 15000, flagsUrl: '', eventsUrl: '' };

CONFIG.ready = fetch('.eventwatch/app.json', { cache: 'no-store' })
    .then(r => {
        if (!r.ok) throw new Error('Cannot load .eventwatch/app.json - run `npm run setup` first.');
        return r.json();
    })
    .then(app => {
        const csv = (id, tab) =>
            `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
        const id = app.sheetId;
        CONFIG.flagsUrl = csv(id, app.flagsTab || 'Flags');
        CONFIG.eventsUrl = csv(id, app.eventsTab || 'Events');
        CONFIG.refresh = app.refresh || CONFIG.refresh;
    });
