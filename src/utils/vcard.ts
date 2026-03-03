import { Contact } from '../types/Contact';

/**
 * Escape special characters per vCard 3.0 spec (RFC 2426).
 * Commas, semicolons, backslashes, and newlines must be escaped.
 */
function escapeVCard(value: string): string {
    if (!value) return '';
    return value
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
}

/**
 * Build a vCard 3.0 string from a Contact object.
 * Only includes non-empty fields.
 */
export function buildVCard(contact: Contact): string {
    const lines: string[] = [];

    lines.push('BEGIN:VCARD');
    lines.push('VERSION:3.0');

    // Structured name — N:LastName;FirstName;;;
    const lastName = escapeVCard(contact.lastName);
    const firstName = escapeVCard(contact.firstName);
    lines.push(`N:${lastName};${firstName};;;`);

    // Formatted name
    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
    if (fullName) lines.push(`FN:${escapeVCard(fullName)}`);

    if (contact.company) lines.push(`ORG:${escapeVCard(contact.company)}`);
    if (contact.jobTitle) lines.push(`TITLE:${escapeVCard(contact.jobTitle)}`);

    if (contact.mobilePhone) lines.push(`TEL;TYPE=CELL:${escapeVCard(contact.mobilePhone)}`);
    if (contact.workPhone) lines.push(`TEL;TYPE=WORK:${escapeVCard(contact.workPhone)}`);

    if (contact.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(contact.email)}`);

    if (contact.website) {
        const url = contact.website.startsWith('http') ? contact.website : `https://${contact.website}`;
        lines.push(`URL:${escapeVCard(url)}`);
    }

    // ADR;TYPE=WORK:pobox;ext;street;city;state;postal;country
    const hasAddress =
        contact.address || contact.city || contact.postalCode || contact.country;
    if (hasAddress) {
        const street = escapeVCard(contact.address);
        const city = escapeVCard(contact.city);
        const postal = escapeVCard(contact.postalCode);
        const country = escapeVCard(contact.country);
        lines.push(`ADR;TYPE=WORK:;;${street};${city};;${postal};${country}`);
    }

    if (contact.notes) lines.push(`NOTE:${escapeVCard(contact.notes)}`);

    lines.push('END:VCARD');

    return lines.join('\r\n');
}

/**
 * Check whether a QR / text payload contains a vCard.
 */
export function isVCard(text: string): boolean {
    return text.trim().toUpperCase().startsWith('BEGIN:VCARD');
}

/**
 * Parse a vCard string into a partial Contact object for preview.
 * This is best-effort and covers vCard 2.1, 3.0, and 4.0.
 */
export function parseVCard(text: string): Partial<Contact> {
    const contact: Partial<Contact> = {};
    const lines = text.split(/\r\n|\r|\n/);

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('BEGIN:') || line.startsWith('END:') || line.startsWith('VERSION:')) {
            continue;
        }

        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;

        const key = line.substring(0, colonIdx).toUpperCase();
        const value = line.substring(colonIdx + 1).replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/g, '\n');

        if (key === 'FN') {
            const parts = value.split(' ');
            contact.firstName = parts[0] || '';
            contact.lastName = parts.slice(1).join(' ') || '';
        } else if (key === 'N') {
            const parts = value.split(';');
            contact.lastName = parts[0] || '';
            contact.firstName = parts[1] || '';
        } else if (key === 'ORG') {
            contact.company = value;
        } else if (key === 'TITLE') {
            contact.jobTitle = value;
        } else if (key.startsWith('TEL')) {
            if (key.includes('CELL') || key.includes('MOBILE')) {
                contact.mobilePhone = value;
            } else if (key.includes('WORK')) {
                contact.workPhone = value;
            } else if (!contact.mobilePhone) {
                contact.mobilePhone = value;
            }
        } else if (key.startsWith('EMAIL')) {
            contact.email = value;
        } else if (key === 'URL') {
            contact.website = value;
        } else if (key.startsWith('ADR')) {
            const parts = value.split(';');
            // pobox;ext;street;city;state;postal;country
            contact.address = parts[2] || '';
            contact.city = parts[3] || '';
            contact.postalCode = parts[5] || '';
            contact.country = parts[6] || '';
        } else if (key === 'NOTE') {
            contact.notes = value;
        }
    }

    return contact;
}
