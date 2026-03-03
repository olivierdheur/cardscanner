import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    useColorScheme,
    TouchableOpacity,
    Alert,
    Image,
    Platform,
    Share,
    ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import * as Clipboard from 'expo-clipboard';
import * as Brightness from 'expo-brightness';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { Contact, EMPTY_CONTACT } from '../types/Contact';
import { buildVCard } from '../utils/vcard';
import { saveAsVCF, shareFile } from '../utils/fileExport';
import { loadProfile } from '../utils/storage';

type Props = BottomTabScreenProps<RootTabParamList, 'QRCode'>;

function ContactPreviewCard({ contact, theme }: { contact: Contact; theme: typeof Colors.light }) {
    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Your Name';
    const styles = makeStyles(theme);

    return (
        <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
                {contact.photoUri ? (
                    <Image source={{ uri: contact.photoUri }} style={styles.previewPhoto} />
                ) : (
                    <View style={styles.previewPhotoPlaceholder}>
                        <Text style={styles.previewPhotoInitials}>
                            {[contact.firstName[0], contact.lastName[0]].filter(Boolean).join('') || '?'}
                        </Text>
                    </View>
                )}
                <View style={styles.previewHeaderText}>
                    <Text style={styles.previewName}>{fullName}</Text>
                    {(contact.jobTitle || contact.company) && (
                        <Text style={styles.previewTitle}>
                            {[contact.jobTitle, contact.company].filter(Boolean).join(' · ')}
                        </Text>
                    )}
                </View>
            </View>
            <View style={styles.previewDivider} />
            {contact.mobilePhone ? (
                <View style={styles.previewRow}>
                    <Text style={styles.previewRowIcon}>📱</Text>
                    <Text style={styles.previewRowText}>{contact.mobilePhone}</Text>
                </View>
            ) : null}
            {contact.workPhone ? (
                <View style={styles.previewRow}>
                    <Text style={styles.previewRowIcon}>☎️</Text>
                    <Text style={styles.previewRowText}>{contact.workPhone}</Text>
                </View>
            ) : null}
            {contact.email ? (
                <View style={styles.previewRow}>
                    <Text style={styles.previewRowIcon}>✉️</Text>
                    <Text style={styles.previewRowText}>{contact.email}</Text>
                </View>
            ) : null}
            {contact.website ? (
                <View style={styles.previewRow}>
                    <Text style={styles.previewRowIcon}>🌐</Text>
                    <Text style={styles.previewRowText}>{contact.website}</Text>
                </View>
            ) : null}
            {(contact.city || contact.country) ? (
                <View style={styles.previewRow}>
                    <Text style={styles.previewRowIcon}>📍</Text>
                    <Text style={styles.previewRowText}>
                        {[contact.city, contact.country].filter(Boolean).join(', ')}
                    </Text>
                </View>
            ) : null}
        </View>
    );
}

export default function QRScreen({ route }: Props) {
    const scheme = useColorScheme() ?? 'light';
    const theme = Colors[scheme];
    const styles = makeStyles(theme);

    const [contact, setContact] = useState<Contact>(route?.params?.contact ?? EMPTY_CONTACT);
    const [loading, setLoading] = useState(false);
    const [brightMode, setBrightMode] = useState(false);
    const qrRef = useRef<any>(null);

    // Keep contact fresh when navigated from Editor
    useFocusEffect(
        useCallback(() => {
            if (route?.params?.contact) {
                setContact(route.params.contact);
            } else {
                loadProfile().then((p) => {
                    if (p) setContact(p);
                });
            }
        }, [route?.params])
    );

    const hasContent = contact.firstName || contact.lastName || contact.email || contact.mobilePhone;
    const vcard = hasContent ? buildVCard(contact) : '';

    const handleShareVCF = async () => {
        if (!vcard) return;
        setLoading(true);
        try {
            const path = await saveAsVCF(vcard, 'contact.vcf');
            await shareFile(path);
        } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to share contact file.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyVCard = async () => {
        if (!vcard) return;
        await Clipboard.setStringAsync(vcard);
        Alert.alert('Copied!', 'vCard text has been copied to clipboard.');
    };

    const handleSaveQRToGallery = async () => {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Grant photo library access in Settings to save the QR code.');
            return;
        }
        if (!qrRef.current) {
            Alert.alert('Error', 'QR code not ready yet.');
            return;
        }
        setLoading(true);
        try {
            qrRef.current.toDataURL(async (data: string) => {
                const { FileSystem } = await import('expo-file-system');
                const path = FileSystem.cacheDirectory + 'qr_contact.png';
                await FileSystem.writeAsStringAsync(path, data, { encoding: 'base64' });
                await MediaLibrary.saveToLibraryAsync(path);
                Alert.alert('Saved!', 'QR code saved to your photo library.');
                setLoading(false);
            });
        } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to save QR code.');
            setLoading(false);
        }
    };

    const handleShareQRImage = async () => {
        if (!qrRef.current) {
            Alert.alert('Error', 'QR code not ready yet.');
            return;
        }
        setLoading(true);
        try {
            qrRef.current.toDataURL(async (data: string) => {
                const { FileSystem } = await import('expo-file-system');
                const path = FileSystem.cacheDirectory + 'qr_contact_share.png';
                await FileSystem.writeAsStringAsync(path, data, { encoding: 'base64' });
                await shareFile(path, 'image/png');
                setLoading(false);
            });
        } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to share QR image.');
            setLoading(false);
        }
    };

    const handleBrightMode = async () => {
        if (brightMode) {
            await Brightness.restoreSystemBrightnessAsync();
            setBrightMode(false);
        } else {
            await Brightness.setBrightnessAsync(1.0);
            setBrightMode(true);
        }
    };

    if (!hasContent) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>⬛</Text>
                <Text style={styles.emptyTitle}>No Contact Data</Text>
                <Text style={styles.emptySubtitle}>
                    Go to the "My Card" tab and fill in your contact details, then tap Generate QR Code.
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={{ backgroundColor: theme.background }}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
        >
            {/* QR Code */}
            <View style={styles.qrCard}>
                <Text style={styles.qrTitle}>Your QR Contact Card</Text>
                <Text style={styles.qrSubtitle}>Scan with any phone camera to add contact</Text>
                <View style={styles.qrWrapper}>
                    <QRCode
                        value={vcard || 'BEGIN:VCARD\nVERSION:3.0\nFN:Empty\nEND:VCARD'}
                        size={240}
                        color={scheme === 'dark' ? '#F1F5F9' : '#0F172A'}
                        backgroundColor={scheme === 'dark' ? '#1E293B' : '#FFFFFF'}
                        getRef={qrRef}
                        ecl="H"
                    />
                </View>
                {brightMode && (
                    <View style={styles.brightBadge}>
                        <Text style={styles.brightBadgeText}>☀️ Brightness Maximized</Text>
                    </View>
                )}
            </View>

            {/* Contact Preview Card */}
            <ContactPreviewCard contact={contact} theme={theme} />

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
                <Text style={styles.actionsTitle}>Actions</Text>

                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={handleShareQRImage} activeOpacity={0.85} disabled={loading}>
                    <Text style={styles.actionBtnIcon}>🖼️</Text>
                    <Text style={styles.actionBtnText}>Share QR Image</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.secondary }]} onPress={handleShareVCF} activeOpacity={0.85} disabled={loading}>
                    <Text style={styles.actionBtnIcon}>📤</Text>
                    <Text style={styles.actionBtnText}>Share Contact (.vcf)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primaryDark }]} onPress={handleSaveQRToGallery} activeOpacity={0.85} disabled={loading}>
                    <Text style={styles.actionBtnIcon}>💾</Text>
                    <Text style={styles.actionBtnText}>Save QR to Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#64748B' }]} onPress={handleCopyVCard} activeOpacity={0.85}>
                    <Text style={styles.actionBtnIcon}>📋</Text>
                    <Text style={styles.actionBtnText}>Copy vCard Text</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: brightMode ? theme.accent : '#475569' }]}
                    onPress={handleBrightMode}
                    activeOpacity={0.85}
                >
                    <Text style={styles.actionBtnIcon}>{brightMode ? '🌙' : '☀️'}</Text>
                    <Text style={styles.actionBtnText}>
                        {brightMode ? 'Restore Brightness' : 'Max Brightness (Event Mode)'}
                    </Text>
                </TouchableOpacity>

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                )}
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const makeStyles = (theme: typeof Colors.light) =>
    StyleSheet.create({
        scroll: {
            padding: 16,
            backgroundColor: theme.background,
        },
        emptyContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            backgroundColor: theme.background,
        },
        emptyIcon: {
            fontSize: 64,
            marginBottom: 16,
        },
        emptyTitle: {
            fontSize: 22,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 8,
        },
        emptySubtitle: {
            fontSize: 15,
            color: theme.textSecondary,
            textAlign: 'center',
            lineHeight: 22,
        },
        qrCard: {
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 24,
            alignItems: 'center',
            marginBottom: 16,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 16,
            elevation: 6,
        },
        qrTitle: {
            fontSize: 20,
            fontWeight: '800',
            color: theme.text,
            marginBottom: 4,
        },
        qrSubtitle: {
            fontSize: 13,
            color: theme.textSecondary,
            marginBottom: 20,
            textAlign: 'center',
        },
        qrWrapper: {
            padding: 16,
            backgroundColor: theme.card,
            borderRadius: 16,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
        },
        brightBadge: {
            marginTop: 12,
            backgroundColor: '#FEF3C7',
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 20,
        },
        brightBadgeText: {
            fontSize: 13,
            fontWeight: '600',
            color: '#92400E',
        },
        previewCard: {
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 8,
            elevation: 3,
        },
        previewHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
        },
        previewPhoto: {
            width: 56,
            height: 56,
            borderRadius: 28,
        },
        previewPhotoPlaceholder: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        previewPhotoInitials: {
            fontSize: 20,
            fontWeight: '700',
            color: '#fff',
        },
        previewHeaderText: {
            flex: 1,
            marginLeft: 14,
        },
        previewName: {
            fontSize: 20,
            fontWeight: '800',
            color: theme.text,
        },
        previewTitle: {
            fontSize: 13,
            color: theme.textSecondary,
            marginTop: 2,
        },
        previewDivider: {
            height: 1,
            backgroundColor: theme.border,
            marginBottom: 12,
        },
        previewRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
        },
        previewRowIcon: {
            fontSize: 16,
            marginRight: 10,
            width: 24,
        },
        previewRowText: {
            fontSize: 14,
            color: theme.textSecondary,
            flex: 1,
        },
        actionsSection: {
            marginBottom: 8,
        },
        actionsTitle: {
            fontSize: 13,
            fontWeight: '700',
            color: theme.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 10,
        },
        actionBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 14,
            paddingVertical: 15,
            paddingHorizontal: 18,
            marginBottom: 10,
        },
        actionBtnIcon: {
            fontSize: 20,
            marginRight: 12,
        },
        actionBtnText: {
            color: '#fff',
            fontSize: 15,
            fontWeight: '600',
            flex: 1,
        },
        loadingOverlay: {
            alignItems: 'center',
            paddingVertical: 16,
        },
    });
