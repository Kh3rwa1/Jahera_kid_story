import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Plus, X, Save, Globe, Users, UserPlus } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { profileService, languageService, familyMemberService, friendService } from '@/services/database';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { getLanguageFlag } from '@/utils/languageUtils';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '@/constants/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const { profile, updateProfile, refreshAll } = useApp();

  const [kidName, setKidName] = useState(profile?.kid_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [familyInput, setFamilyInput] = useState('');
  const [friendInput, setFriendInput] = useState('');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSaveName = useCallback(async () => {
    if (!profile || kidName.trim().length < 2) return;
    setIsSaving(true);
    const updated = await profileService.update(profile.id, { kid_name: kidName.trim() });
    if (updated) {
      updateProfile({ kid_name: kidName.trim() });
      setSaveMessage('Name updated!');
      setTimeout(() => setSaveMessage(null), 2000);
    }
    setIsSaving(false);
  }, [profile, kidName, updateProfile]);

  const handleAddLanguage = useCallback(async (langCode: string, langName: string) => {
    if (!profile) return;
    const existing = profile.languages?.find(l => l.language_code === langCode);
    if (existing) return;
    const result = await languageService.add(profile.id, langCode, langName);
    if (result) {
      updateProfile({ languages: [...(profile.languages || []), result] });
    }
    setShowLanguagePicker(false);
  }, [profile, updateProfile]);

  const handleRemoveLanguage = useCallback(async (langCode: string) => {
    if (!profile || (profile.languages?.length || 0) <= 1) return;
    const success = await languageService.deleteByProfileAndCode(profile.id, langCode);
    if (success) {
      updateProfile({ languages: profile.languages?.filter(l => l.language_code !== langCode) || [] });
    }
  }, [profile, updateProfile]);

  const handleAddFamilyMember = useCallback(async () => {
    if (!profile || familyInput.trim().length < 2) return;
    const result = await familyMemberService.add(profile.id, familyInput.trim());
    if (result) {
      updateProfile({ family_members: [...(profile.family_members || []), result] });
      setFamilyInput('');
    }
  }, [profile, familyInput, updateProfile]);

  const handleRemoveFamilyMember = useCallback(async (id: string) => {
    if (!profile) return;
    const success = await familyMemberService.delete(id);
    if (success) {
      updateProfile({ family_members: profile.family_members?.filter(m => m.id !== id) || [] });
    }
  }, [profile, updateProfile]);

  const handleAddFriend = useCallback(async () => {
    if (!profile || friendInput.trim().length < 2) return;
    const result = await friendService.add(profile.id, friendInput.trim());
    if (result) {
      updateProfile({ friends: [...(profile.friends || []), result] });
      setFriendInput('');
    }
  }, [profile, friendInput, updateProfile]);

  const handleRemoveFriend = useCallback(async (id: string) => {
    if (!profile) return;
    const success = await friendService.delete(id);
    if (success) {
      updateProfile({ friends: profile.friends?.filter(f => f.id !== id) || [] });
    }
  }, [profile, updateProfile]);

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
        <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: COLORS.text.secondary }]}>No profile found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const availableLanguages = SUPPORTED_LANGUAGES.filter(
    lang => !profile.languages?.some(l => l.language_code === lang.code)
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={22} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: COLORS.text.primary }]}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <View style={[styles.sectionCard, { backgroundColor: COLORS.cardBackground }]}>
            <Text style={[styles.sectionLabel, { color: COLORS.text.secondary }]}>Child's Name</Text>
            <View style={styles.nameRow}>
              <TextInput
                style={[styles.nameInput, { color: COLORS.text.primary, borderColor: COLORS.text.light + '40' }]}
                value={kidName}
                onChangeText={setKidName}
                placeholder="Enter name"
                placeholderTextColor={COLORS.text.light}
              />
              <TouchableOpacity
                style={[styles.saveNameButton, {
                  backgroundColor: kidName.trim() !== profile.kid_name && kidName.trim().length >= 2
                    ? COLORS.primary : COLORS.text.light + '30'
                }]}
                onPress={handleSaveName}
                disabled={kidName.trim() === profile.kid_name || kidName.trim().length < 2 || isSaving}
              >
                <Save size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {saveMessage && (
              <Text style={[styles.saveMsg, { color: COLORS.success }]}>{saveMessage}</Text>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).springify()}>
          <View style={[styles.sectionCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={styles.sectionHeaderRow}>
              <Globe size={18} color={COLORS.primary} />
              <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Languages</Text>
            </View>
            <View style={styles.chipGrid}>
              {profile.languages?.map(lang => (
                <View key={lang.id} style={[styles.langChip, { backgroundColor: COLORS.primary + '12' }]}>
                  <Text style={styles.langChipFlag}>{getLanguageFlag(lang.language_code)}</Text>
                  <Text style={[styles.langChipText, { color: COLORS.text.primary }]}>{lang.language_name}</Text>
                  {(profile.languages?.length || 0) > 1 && (
                    <TouchableOpacity onPress={() => handleRemoveLanguage(lang.language_code)}>
                      <X size={14} color={COLORS.text.light} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
            {!showLanguagePicker && availableLanguages.length > 0 && (
              <TouchableOpacity
                style={[styles.addButton, { borderColor: COLORS.primary + '40' }]}
                onPress={() => setShowLanguagePicker(true)}
              >
                <Plus size={16} color={COLORS.primary} />
                <Text style={[styles.addButtonText, { color: COLORS.primary }]}>Add Language</Text>
              </TouchableOpacity>
            )}
            {showLanguagePicker && (
              <View style={styles.languagePickerGrid}>
                {availableLanguages.slice(0, 12).map(lang => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.pickerItem, { backgroundColor: COLORS.text.light + '10' }]}
                    onPress={() => handleAddLanguage(lang.code, lang.name)}
                  >
                    <Text style={styles.pickerFlag}>{lang.flag}</Text>
                    <Text style={[styles.pickerName, { color: COLORS.text.primary }]}>{lang.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(220).springify()}>
          <View style={[styles.sectionCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={styles.sectionHeaderRow}>
              <Users size={18} color={COLORS.primary} />
              <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Family Members</Text>
            </View>
            <View style={styles.chipGrid}>
              {profile.family_members?.map(m => (
                <View key={m.id} style={[styles.personChip, { backgroundColor: COLORS.primary + '12' }]}>
                  <Text style={[styles.personName, { color: COLORS.text.primary }]}>{m.name}</Text>
                  <TouchableOpacity onPress={() => handleRemoveFamilyMember(m.id)}>
                    <X size={14} color={COLORS.text.light} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.addRow}>
              <TextInput
                style={[styles.addInput, { color: COLORS.text.primary, borderColor: COLORS.text.light + '40' }]}
                value={familyInput}
                onChangeText={setFamilyInput}
                placeholder="Add family member"
                placeholderTextColor={COLORS.text.light}
                onSubmitEditing={handleAddFamilyMember}
              />
              <TouchableOpacity
                style={[styles.addCircle, { backgroundColor: familyInput.trim().length >= 2 ? COLORS.primary : COLORS.text.light + '30' }]}
                onPress={handleAddFamilyMember}
                disabled={familyInput.trim().length < 2}
              >
                <Plus size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(290).springify()}>
          <View style={[styles.sectionCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={styles.sectionHeaderRow}>
              <UserPlus size={18} color={COLORS.primary} />
              <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Friends</Text>
            </View>
            <View style={styles.chipGrid}>
              {profile.friends?.map(f => (
                <View key={f.id} style={[styles.personChip, { backgroundColor: COLORS.info + '12' }]}>
                  <Text style={[styles.personName, { color: COLORS.text.primary }]}>{f.name}</Text>
                  <TouchableOpacity onPress={() => handleRemoveFriend(f.id)}>
                    <X size={14} color={COLORS.text.light} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.addRow}>
              <TextInput
                style={[styles.addInput, { color: COLORS.text.primary, borderColor: COLORS.text.light + '40' }]}
                value={friendInput}
                onChangeText={setFriendInput}
                placeholder="Add friend"
                placeholderTextColor={COLORS.text.light}
                onSubmitEditing={handleAddFriend}
              />
              <TouchableOpacity
                style={[styles.addCircle, { backgroundColor: friendInput.trim().length >= 2 ? COLORS.primary : COLORS.text.light + '30' }]}
                onPress={handleAddFriend}
                disabled={friendInput.trim().length < 2}
              >
                <Plus size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, fontFamily: FONTS.medium },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { fontSize: 18, fontFamily: FONTS.bold },
  scrollContent: { padding: SPACING.xl, paddingBottom: 100, gap: SPACING.lg },
  sectionCard: {
    padding: SPACING.lg, borderRadius: BORDER_RADIUS.xl, ...SHADOWS.sm,
  },
  sectionLabel: { fontSize: 13, fontFamily: FONTS.semibold, marginBottom: SPACING.sm },
  nameRow: { flexDirection: 'row', gap: SPACING.sm },
  nameInput: {
    flex: 1, fontSize: 16, fontFamily: FONTS.medium,
    borderWidth: 1, borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md, height: 48,
  },
  saveNameButton: {
    width: 48, height: 48, borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  saveMsg: { fontSize: 13, fontFamily: FONTS.medium, marginTop: SPACING.sm },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  sectionTitle: { fontSize: 16, fontFamily: FONTS.bold },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  langChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.pill,
  },
  langChipFlag: { fontSize: 16 },
  langChipText: { fontSize: 13, fontFamily: FONTS.semibold },
  addButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: SPACING.md,
    borderWidth: 1, borderStyle: 'dashed', borderRadius: BORDER_RADIUS.lg,
    alignSelf: 'flex-start',
  },
  addButtonText: { fontSize: 13, fontFamily: FONTS.semibold },
  languagePickerGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm,
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.pill,
  },
  pickerFlag: { fontSize: 16 },
  pickerName: { fontSize: 12, fontFamily: FONTS.medium },
  personChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.pill,
  },
  personName: { fontSize: 13, fontFamily: FONTS.semibold },
  addRow: { flexDirection: 'row', gap: SPACING.sm },
  addInput: {
    flex: 1, fontSize: 14, fontFamily: FONTS.medium,
    borderWidth: 1, borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md, height: 44,
  },
  addCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
});
