import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact, EMPTY_CONTACT } from '../types/Contact';

const PROFILE_KEY = '@qr_contact_card:profile';
const LAST_QR_KEY = '@qr_contact_card:last_qr';

export async function saveProfile(contact: Contact): Promise<void> {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(contact));
}

export async function loadProfile(): Promise<Contact | null> {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as Contact;
    } catch {
        return null;
    }
}

export async function saveLastQR(vcard: string): Promise<void> {
    await AsyncStorage.setItem(LAST_QR_KEY, vcard);
}

export async function loadLastQR(): Promise<string | null> {
    return AsyncStorage.getItem(LAST_QR_KEY);
}

export async function clearStorage(): Promise<void> {
    await AsyncStorage.multiRemove([PROFILE_KEY, LAST_QR_KEY]);
}
