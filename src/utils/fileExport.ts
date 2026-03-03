import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Write a vCard string to a .vcf file in the cache directory.
 * Returns the file URI so it can be shared or opened.
 */
export async function saveAsVCF(vcard: string, filename = 'contact.vcf'): Promise<string> {
    const path = FileSystem.cacheDirectory + filename;
    await FileSystem.writeAsStringAsync(path, vcard, {
        encoding: FileSystem.EncodingType.UTF8,
    });
    return path;
}

/**
 * Open the system share sheet for a given file URI.
 */
export async function shareFile(uri: string, mimeType = 'text/vcard'): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
        throw new Error('Sharing is not available on this device.');
    }
    await Sharing.shareAsync(uri, {
        mimeType,
        dialogTitle: 'Share Contact',
        UTI: 'public.vcard',
    });
}
