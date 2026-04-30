const DOMAIN_CONFIG = {
    // Development configs mapped by domain
    'localhost': {
        flagsUrl: 'https://d1rjwubi68tcys.cloudfront.net/spreadsheets/d/1Kn9fKSrXvKeoheT2QITatpOBKel3KCKzTOTtVQAOuxs/export?format=csv&gid=0',
        eventsUrl: 'https://d1rjwubi68tcys.cloudfront.net/spreadsheets/d/1xYny4WkVy9R5zp8pvih_2iDC43i_k1-MmbCs5DBm-tE/export?format=csv&gid=0',
    },
    '127.0.0.1': {
        flagsUrl: 'https://d1rjwubi68tcys.cloudfront.net/spreadsheets/d/1Kn9fKSrXvKeoheT2QITatpOBKel3KCKzTOTtVQAOuxs/export?format=csv&gid=0',
        eventsUrl: 'https://d1rjwubi68tcys.cloudfront.net/spreadsheets/d/1xYny4WkVy9R5zp8pvih_2iDC43i_k1-MmbCs5DBm-tE/export?format=csv&gid=0',
    },
    // Default config for production and any other unmapped domains
    'default': {
        flagsUrl: 'https://d1rjwubi68tcys.cloudfront.net/spreadsheets/d/1CFk4ZNrmoAQPJ63biuAPgsNj7IOtv7121AI-Nfc8HyQ/export?format=csv&gid=0',
        eventsUrl: 'https://d1rjwubi68tcys.cloudfront.net/spreadsheets/d/1-FFCVjlh286EsGJxf8bevz6usy9SzznEbZemXQj2Wmg/export?format=csv&gid=0',
    }
};

const currentDomain = window.location.hostname;
const activeDomainConfig = DOMAIN_CONFIG[currentDomain] || DOMAIN_CONFIG['default'];

const CONFIG = {
    flagsUrl: activeDomainConfig.flagsUrl,
    eventsUrl: activeDomainConfig.eventsUrl,
    refresh: 15000
};
