import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    useColorScheme,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { Contact, EMPTY_CONTACT } from '../types/Contact';
import { saveProfile, loadProfile } from '../utils/storage';
import { launchImageLibrary } from 'react-native-image-picker';

type Props = BottomTabScreenProps<RootTabParamList, 'Editor'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d\s\-().]{7,20}$/;

interface Field {
    key: keyof Contact;
    label: string;
    placeholder: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    multiline?: boolean;
}

const FIELDS: Field[] = [
    { key: 'firstName', label: 'First Name', placeholder: 'John', autoCapitalize: 'words' },
    { key: 'lastName', label: 'Last Name', placeholder: 'Doe', autoCapitalize: 'words' },
    { key: 'company', label: 'Company', placeholder: 'Acme Corp', autoCapitalize: 'words' },
    { key: 'jobTitle', label: 'Job Title', placeholder: 'Product Manager', autoCapitalize: 'words' },
    { key: 'mobilePhone', label: 'Mobile Phone', placeholder: '+1 555 000 0000', keyboardType: 'phone-pad' },
    { key: 'workPhone', label: 'Work Phone', placeholder: '+1 555 000 0001', keyboardType: 'phone-pad' },
    { key: 'email', label: 'Email', placeholder: 'john@example.com', keyboardType: 'email-address', autoCapitalize: 'none' },
    { key: 'website', label: 'Website', placeholder: 'https://example.com', keyboardType: 'url', autoCapitalize: 'none' },
    { key: 'address', label: 'Address', placeholder: '123 Main St', autoCapitalize: 'words' },
    { key: 'city', label: 'City', placeholder: 'New York', autoCapitalize: 'words' },
    { key: 'postalCode', label: 'Postal Code', placeholder: '10001' },
    { key: 'country', label: 'Country', placeholder: 'United States', autoCapitalize: 'words' },
    { key: 'notes', label: 'Notes', placeholder: 'Add a note...', multiline: true },
];

export default function EditorScreen({ navigation }: Props) {
    const scheme = useColorScheme() ?? 'light';
    const theme = Colors[scheme];
    const styles = makeStyles(theme);

    const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
    const [errors, setErrors] = useState<Partial<Record<keyof Contact, string>>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Load saved profile when screen focuses
    useFocusEffect(
        useCallback(() => {
            loadProfile().then((profile) => {
                if (profile) setContact(profile);
            });
        }, [])
    );

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof Contact, string>> = {};
        if (!contact.firstName && !contact.lastName) {
            newErrors.firstName = 'Enter at least a first or last name.';
        }
        if (contact.email && !EMAIL_REGEX.test(contact.email)) {
            newErrors.email = 'Enter a valid email address.';
        }
        if (contact.mobilePhone && !PHONE_REGEX.test(contact.mobilePhone)) {
            newErrors.mobilePhone = 'Enter a valid phone number.';
        }
        if (contact.workPhone && !PHONE_REGEX.test(contact.workPhone)) {
            newErrors.workPhone = 'Enter a valid phone number.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const pickPhoto = async () => {
        const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.7 });
        if (result.assets && result.assets[0]?.uri) {
            setContact((prev) => ({ ...prev, photoUri: result.assets![0].uri }));
        }
    };

    const handleGenerateQR = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            await saveProfile(contact);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            navigation.navigate('QRCode', { contact });
        } catch (e) {
            Alert.alert('Error', 'Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (key: keyof Contact, value: string) => {
        setContact((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.heading}>Contact Editor</Text>
                    <Text style={styles.subheading}>Fill in your details to generate a QR contact card</Text>
                </View>

                {/* Profile Photo */}
                <View style={styles.photoSection}>
                    <TouchableOpacity onPress={pickPhoto} style={styles.photoButton} activeOpacity={0.8}>
                        {contact.photoUri ? (
                            <Image source={{ uri: contact.photoUri }} style={styles.photo} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Text style={styles.photoIcon}>📷</Text>
                                <Text style={styles.photoLabel}>Add Photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    {contact.photoUri && (
                        <TouchableOpacity
                            onPress={() => setContact((p) => ({ ...p, photoUri: undefined }))}
                            style={styles.removePhoto}
                        >
                            <Text style={[styles.removePhotoText, { color: theme.error }]}>Remove Photo</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Form Fields */}
                <View style={styles.formCard}>
                    {FIELDS.map((field, index) => (
                        <View key={field.key} style={[styles.fieldGroup, index === FIELDS.length - 1 && { borderBottomWidth: 0 }]}>
                            <Text style={styles.label}>{field.label}</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    field.multiline && styles.inputMultiline,
                                    errors[field.key] && styles.inputError,
                                ]}
                                placeholder={field.placeholder}
                                placeholderTextColor={theme.textMuted}
                                value={contact[field.key] as string}
                                onChangeText={(val) => updateField(field.key, val)}
                                keyboardType={field.keyboardType ?? 'default'}
                                autoCapitalize={field.autoCapitalize ?? 'sentences'}
                                multiline={field.multiline}
                                numberOfLines={field.multiline ? 3 : 1}
                                returnKeyType={field.multiline ? 'default' : 'next'}
                            />
                            {errors[field.key] && (
                                <Text style={styles.errorText}>{errors[field.key]}</Text>
                            )}
                        </View>
                    ))}
                </View>

                {/* Generate Button */}
                <TouchableOpacity
                    style={[styles.generateBtn, saving && styles.generateBtnDisabled]}
                    onPress={handleGenerateQR}
                    activeOpacity={0.85}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.generateBtnIcon}>⬛</Text>
                            <Text style={styles.generateBtnText}>
                                {saved ? 'Saved! Opening QR...' : 'Generate QR Code'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setContact(EMPTY_CONTACT)}
                    style={styles.clearBtn}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.clearBtnText, { color: theme.textMuted }]}>Clear All Fields</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const makeStyles = (theme: typeof Colors.light) =>
    StyleSheet.create({
        scroll: {
            padding: 16,
            backgroundColor: theme.background,
        },
        header: {
            marginBottom: 20,
            paddingTop: 8,
        },
        heading: {
            fontSize: 28,
            fontWeight: '800',
            color: theme.text,
            letterSpacing: -0.5,
        },
        subheading: {
            fontSize: 14,
            color: theme.textSecondary,
            marginTop: 4,
            lineHeight: 20,
        },
        photoSection: {
            alignItems: 'center',
            marginBottom: 20,
        },
        photoButton: {
            width: 100,
            height: 100,
            borderRadius: 50,
            overflow: 'hidden',
            backgroundColor: theme.inputBackground,
            borderWidth: 2,
            borderColor: theme.primary,
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
        },
        photo: {
            width: 100,
            height: 100,
            borderRadius: 50,
        },
        photoPlaceholder: {
            alignItems: 'center',
        },
        photoIcon: {
            fontSize: 28,
        },
        photoLabel: {
            fontSize: 11,
            marginTop: 4,
            color: theme.primary,
            fontWeight: '600',
        },
        removePhoto: {
            marginTop: 8,
        },
        removePhotoText: {
            fontSize: 13,
            fontWeight: '500',
        },
        formCard: {
            backgroundColor: theme.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 8,
            elevation: 3,
        },
        fieldGroup: {
            marginBottom: 12,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        label: {
            fontSize: 12,
            fontWeight: '700',
            color: theme.primary,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 6,
        },
        input: {
            backgroundColor: theme.inputBackground,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 11,
            fontSize: 15,
            color: theme.text,
            borderWidth: 1,
            borderColor: 'transparent',
        },
        inputMultiline: {
            height: 80,
            textAlignVertical: 'top',
            paddingTop: 10,
        },
        inputError: {
            borderColor: theme.error,
        },
        errorText: {
            fontSize: 12,
            color: theme.error,
            marginTop: 4,
        },
        generateBtn: {
            backgroundColor: theme.primary,
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 16,
            marginBottom: 12,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 6,
        },
        generateBtnDisabled: {
            opacity: 0.7,
        },
        generateBtnIcon: {
            fontSize: 18,
            marginRight: 8,
        },
        generateBtnText: {
            color: '#fff',
            fontSize: 17,
            fontWeight: '700',
            letterSpacing: -0.2,
        },
        clearBtn: {
            alignItems: 'center',
            paddingVertical: 10,
        },
        clearBtnText: {
            fontSize: 14,
            fontWeight: '500',
        },
    });
