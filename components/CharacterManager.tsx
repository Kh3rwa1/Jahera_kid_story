import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import ReAnimated, { FadeInUp, ZoomIn, FadeOut } from 'react-native-reanimated';
import { Users, UserPlus, X, Check, CreditCard as Edit2 } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '@/constants/theme';
import { FamilyMember, Friend } from '@/types/database';
import { familyMemberService, friendService } from '@/services/database';
import { hapticFeedback } from '@/utils/haptics';

type CharacterType = 'family' | 'friend';

interface CharacterManagerProps {
  profileId: string;
  familyMembers: FamilyMember[];
  friends: Friend[];
  onFamilyMembersChange: (members: FamilyMember[]) => void;
  onFriendsChange: (friends: Friend[]) => void;
}

interface AddModalState {
  visible: boolean;
  type: CharacterType;
  name: string;
  saving: boolean;
  error: string | null;
}

interface EditModalState {
  visible: boolean;
  id: string;
  type: CharacterType;
  name: string;
  saving: boolean;
  error: string | null;
}

export function CharacterManager({
  profileId,
  familyMembers,
  friends,
  onFamilyMembersChange,
  onFriendsChange,
}: CharacterManagerProps) {
  const [addModal, setAddModal] = useState<AddModalState>({
    visible: false,
    type: 'family',
    name: '',
    saving: false,
    error: null,
  });

  const [editModal, setEditModal] = useState<EditModalState>({
    visible: false,
    id: '',
    type: 'family',
    name: '',
    saving: false,
    error: null,
  });

  const openAdd = (type: CharacterType) => {
    hapticFeedback.light();
    setAddModal({ visible: true, type, name: '', saving: false, error: null });
  };

  const closeAdd = () => setAddModal(prev => ({ ...prev, visible: false, name: '', error: null }));

  const openEdit = (id: string, type: CharacterType, currentName: string) => {
    hapticFeedback.light();
    setEditModal({ visible: true, id, type, name: currentName, saving: false, error: null });
  };

  const closeEdit = () => setEditModal(prev => ({ ...prev, visible: false, error: null }));

  const handleAdd = async () => {
    const trimmed = addModal.name.trim();
    if (!trimmed) {
      setAddModal(prev => ({ ...prev, error: 'Please enter a name' }));
      return;
    }

    setAddModal(prev => ({ ...prev, saving: true, error: null }));

    if (addModal.type === 'family') {
      const member = await familyMemberService.add(profileId, trimmed);
      if (member) {
        onFamilyMembersChange([...familyMembers, member]);
        hapticFeedback.success();
        closeAdd();
      } else {
        setAddModal(prev => ({ ...prev, saving: false, error: 'Failed to add character. Try again.' }));
      }
    } else {
      const friend = await friendService.add(profileId, trimmed);
      if (friend) {
        onFriendsChange([...friends, friend]);
        hapticFeedback.success();
        closeAdd();
      } else {
        setAddModal(prev => ({ ...prev, saving: false, error: 'Failed to add character. Try again.' }));
      }
    }
  };

  const handleEdit = async () => {
    const trimmed = editModal.name.trim();
    if (!trimmed) {
      setEditModal(prev => ({ ...prev, error: 'Please enter a name' }));
      return;
    }

    setEditModal(prev => ({ ...prev, saving: true, error: null }));

    if (editModal.type === 'family') {
      const ok = await familyMemberService.delete(editModal.id);
      if (ok) {
        const newMember = await familyMemberService.add(profileId, trimmed);
        if (newMember) {
          onFamilyMembersChange(familyMembers.filter(m => m.id !== editModal.id).concat(newMember));
          hapticFeedback.success();
          closeEdit();
          return;
        }
      }
      setEditModal(prev => ({ ...prev, saving: false, error: 'Failed to update. Try again.' }));
    } else {
      const ok = await friendService.delete(editModal.id);
      if (ok) {
        const newFriend = await friendService.add(profileId, trimmed);
        if (newFriend) {
          onFriendsChange(friends.filter(f => f.id !== editModal.id).concat(newFriend));
          hapticFeedback.success();
          closeEdit();
          return;
        }
      }
      setEditModal(prev => ({ ...prev, saving: false, error: 'Failed to update. Try again.' }));
    }
  };

  const handleDelete = async (id: string, type: CharacterType) => {
    hapticFeedback.medium();
    if (type === 'family') {
      const ok = await familyMemberService.delete(id);
      if (ok) onFamilyMembersChange(familyMembers.filter(m => m.id !== id));
    } else {
      const ok = await friendService.delete(id);
      if (ok) onFriendsChange(friends.filter(f => f.id !== id));
    }
  };

  const allCharacters = [
    ...familyMembers.map(m => ({ id: m.id, name: m.name, type: 'family' as CharacterType })),
    ...friends.map(f => ({ id: f.id, name: f.name, type: 'friend' as CharacterType })),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Users size={16} color="#475569" strokeWidth={2} />
          <Text style={styles.sectionLabel}>Characters in Story</Text>
        </View>
        <View style={styles.addButtons}>
          <TouchableOpacity style={styles.addBtn} onPress={() => openAdd('family')} activeOpacity={0.8}>
            <UserPlus size={13} color="#0EA5E9" strokeWidth={2.5} />
            <Text style={[styles.addBtnText, { color: '#0EA5E9' }]}>Family</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, styles.addBtnFriend]} onPress={() => openAdd('friend')} activeOpacity={0.8}>
            <UserPlus size={13} color="#10B981" strokeWidth={2.5} />
            <Text style={[styles.addBtnText, { color: '#10B981' }]}>Friend</Text>
          </TouchableOpacity>
        </View>
      </View>

      {allCharacters.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No characters yet — add family or friends to include them in the story</Text>
        </View>
      ) : (
        <View style={styles.chipsWrap}>
          {allCharacters.map((char, i) => (
            <ReAnimated.View key={char.id} entering={FadeInUp.delay(i * 40).springify()}>
              <View style={[styles.chip, char.type === 'family' ? styles.chipFamily : styles.chipFriend]}>
                <TouchableOpacity onPress={() => openEdit(char.id, char.type, char.name)} activeOpacity={0.7}>
                  <View style={styles.chipInner}>
                    <Text style={[styles.chipText, char.type === 'family' ? styles.chipTextFamily : styles.chipTextFriend]}>
                      {char.name}
                    </Text>
                    <Edit2 size={10} color={char.type === 'family' ? '#0EA5E9' : '#10B981'} strokeWidth={2.5} />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(char.id, char.type)} style={styles.chipDelete} activeOpacity={0.7}>
                  <X size={12} color={char.type === 'family' ? '#0EA5E9' : '#10B981'} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </ReAnimated.View>
          ))}
        </View>
      )}

      <Modal visible={addModal.visible} transparent animationType="fade" onRequestClose={closeAdd}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeAdd} activeOpacity={1} />
          <ReAnimated.View entering={ZoomIn.springify()} style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Add {addModal.type === 'family' ? 'Family Member' : 'Friend'}
            </Text>
            <Text style={styles.modalSubtitle}>
              They'll appear as a character in the story
            </Text>
            <TextInput
              style={[styles.modalInput, addModal.error ? styles.modalInputError : null]}
              placeholder="Enter name..."
              placeholderTextColor="#94A3B8"
              value={addModal.name}
              onChangeText={t => setAddModal(prev => ({ ...prev, name: t, error: null }))}
              autoFocus
              maxLength={30}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            {addModal.error && <Text style={styles.inputError}>{addModal.error}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeAdd} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, addModal.type === 'family' ? styles.confirmFamily : styles.confirmFriend]}
                onPress={handleAdd}
                disabled={addModal.saving}
                activeOpacity={0.85}
              >
                <Check size={15} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.confirmBtnText}>{addModal.saving ? 'Adding...' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </ReAnimated.View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={editModal.visible} transparent animationType="fade" onRequestClose={closeEdit}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeEdit} activeOpacity={1} />
          <ReAnimated.View entering={ZoomIn.springify()} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Character</Text>
            <Text style={styles.modalSubtitle}>Update the name for this character</Text>
            <TextInput
              style={[styles.modalInput, editModal.error ? styles.modalInputError : null]}
              placeholder="Enter name..."
              placeholderTextColor="#94A3B8"
              value={editModal.name}
              onChangeText={t => setEditModal(prev => ({ ...prev, name: t, error: null }))}
              autoFocus
              maxLength={30}
              returnKeyType="done"
              onSubmitEditing={handleEdit}
            />
            {editModal.error && <Text style={styles.inputError}>{editModal.error}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeEdit} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, editModal.type === 'family' ? styles.confirmFamily : styles.confirmFriend]}
                onPress={handleEdit}
                disabled={editModal.saving}
                activeOpacity={0.85}
              >
                <Check size={15} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.confirmBtnText}>{editModal.saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </ReAnimated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  addButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addBtnFriend: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  addBtnText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  emptyWrap: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  chipFamily: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  chipFriend: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  chipTextFamily: { color: '#0369A1' },
  chipTextFriend: { color: '#047857' },
  chipDelete: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    gap: SPACING.sm,
    ...SHADOWS.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.extrabold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#64748B',
    marginBottom: SPACING.sm,
  },
  modalInput: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  modalInputError: {
    borderColor: '#EF4444',
  },
  inputError: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#EF4444',
    marginTop: -4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: FONTS.semibold,
    color: '#64748B',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: BORDER_RADIUS.lg,
  },
  confirmFamily: { backgroundColor: '#0EA5E9' },
  confirmFriend: { backgroundColor: '#10B981' },
  confirmBtnText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
});
