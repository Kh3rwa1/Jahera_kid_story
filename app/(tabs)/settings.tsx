import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  Key,
  Palette,
  ChevronRight,
  UserCog,
  LogOut,
  Star,
  Crown,
  Zap,
  Shield,
  BookOpen,
  Globe,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS, FONT_SIZES } from '@/constants/theme';
import { ProfileAvatar } from '@/components/ProfileAvatar';

interface SettingRow {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  iconBg: string;
  route?: string;
  onPress?: () => void;
  badge?: string;
  badgeColor?: string;
  destructive?: boolean;
}

interface SettingGroup {
  title: string;
  rows: SettingRow[];
}

function RowItem({ row, COLORS, onPress }: { row: SettingRow; COLORS: any; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.975, { damping: 18 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 18 }); }}
        activeOpacity={1}
        style={styles.row}
      >
        <View style={[styles.rowIcon, { backgroundColor: row.iconBg }]}>
          {row.icon}
        </View>
        <View style={styles.rowBody}>
          <Text style={[styles.rowLabel, { color: row.destructive ? COLORS.error : COLORS.text.primary }]}>
            {row.label}
          </Text>
          {row.sublabel ? (
            <Text style={[styles.rowSub, { color: COLORS.text.secondary }]} numberOfLines={1}>
              {row.sublabel}
            </Text>
          ) : null}
        </View>
        <View style={styles.rowTrailing}>
          {row.badge ? (
            <View style={[styles.badge, { backgroundColor: row.badgeColor || COLORS.primary }]}>
              <Text style={styles.badgeText}>{row.badge}</Text>
            </View>
          ) : null}
          {!row.destructive && (
            <ChevronRight size={15} color={COLORS.text.light} strokeWidth={2.5} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SettingsTab() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { clearProfile, profile, stories } = useApp();
  const COLORS = currentTheme.colors;
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        setSigningOut(true);
        clearProfile();
        signOut().then(() => router.replace('/'));
      }
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          clearProfile();
          await signOut();
          router.replace('/');
        },
      },
    ]);
  };

  const groups: SettingGroup[] = [
    {
      title: 'Profile',
      rows: [
        {
          id: 'edit-profile',
          label: 'Edit Profile',
          sublabel: profile?.kid_name ? `${profile.kid_name}'s profile` : 'Update name & avatar',
          icon: <UserCog size={17} color="#FFFFFF" strokeWidth={2} />,
          iconBg: '#3B82F6',
          route: '/settings/edit-profile',
        },
        {
          id: 'languages',
          label: 'Languages',
          sublabel: profile?.languages?.length
            ? `${profile.languages.length} language${profile.languages.length !== 1 ? 's' : ''} active`
            : 'Add learning languages',
          icon: <Globe size={17} color="#FFFFFF" strokeWidth={2} />,
          iconBg: '#10B981',
          route: '/settings/edit-profile',
        },
      ],
    },
    {
      title: 'Appearance',
      rows: [
        {
          id: 'customization',
          label: 'Themes & Colors',
          sublabel: 'Personalize your experience',
          icon: <Palette size={17} color="#FFFFFF" strokeWidth={2} />,
          iconBg: '#F59E0B',
          route: '/settings/customization',
        },
      ],
    },
    {
      title: 'Developer',
      rows: [
        {
          id: 'api-keys',
          label: 'API Keys',
          sublabel: 'OpenAI & ElevenLabs',
          icon: <Key size={17} color="#FFFFFF" strokeWidth={2} />,
          iconBg: '#6366F1',
          route: '/settings/api-keys',
        },
      ],
    },
    {
      title: 'Account',
      rows: [
        {
          id: 'signout',
          label: signingOut ? 'Signing out…' : 'Sign Out',
          icon: <LogOut size={17} color={COLORS.error} strokeWidth={2} />,
          iconBg: COLORS.error + '20',
          destructive: true,
          onPress: handleSignOut,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Page header */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: COLORS.text.primary }]}>Settings</Text>
        </Animated.View>

        {/* ── Profile hero ── */}
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <LinearGradient
            colors={COLORS.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Top row */}
            <View style={styles.heroTop}>
              <View style={styles.heroAvatarWrap}>
                <ProfileAvatar
                  avatarUrl={profile?.avatar_url ?? null}
                  name={profile?.kid_name ?? user?.email ?? '?'}
                  size="medium"
                  editable={false}
                />
                <View style={styles.crownBadge}>
                  <Crown size={9} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              </View>

              <View style={styles.heroInfo}>
                <Text style={styles.heroName} numberOfLines={1}>
                  {profile?.kid_name || 'Your Profile'}
                </Text>
                <Text style={styles.heroEmail} numberOfLines={1}>
                  {user?.email || ''}
                </Text>
                <View style={styles.heroPlanPill}>
                  <Zap size={10} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.heroPlanText}>Free plan</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.heroEditBtn}
                onPress={() => router.push('/settings/edit-profile')}
                activeOpacity={0.75}
              >
                <Text style={styles.heroEditText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Stats row */}
            <View style={styles.heroStats}>
              {[
                { icon: <BookOpen size={13} color="rgba(255,255,255,0.9)" />, value: String(stories.length), label: 'Stories' },
                { icon: <Star size={13} color="rgba(255,255,255,0.9)" />, value: String(profile?.languages?.length ?? 0), label: 'Languages' },
                { icon: <Zap size={13} color="rgba(255,255,255,0.9)" />, value: 'Free', label: 'Plan' },
              ].map((stat, i, arr) => (
                <React.Fragment key={stat.label}>
                  <View style={styles.heroStat}>
                    <View style={styles.heroStatIcon}>{stat.icon}</View>
                    <Text style={styles.heroStatVal}>{stat.value}</Text>
                    <Text style={styles.heroStatLbl}>{stat.label}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={styles.heroStatDiv} />}
                </React.Fragment>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Upgrade banner ── */}
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <TouchableOpacity onPress={() => router.push('/paywall')} activeOpacity={0.88}>
            <LinearGradient
              colors={['#F59E0B', '#EF4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeBanner}
            >
              <View style={styles.upgradeIconBox}>
                <Crown size={19} color="#F59E0B" fill="#F59E0B" />
              </View>
              <View style={styles.upgradeBody}>
                <Text style={styles.upgradeTitle}>Unlock Premium</Text>
                <Text style={styles.upgradeSub}>Unlimited stories · More voices</Text>
              </View>
              <View style={styles.upgradeArrow}>
                <ChevronRight size={17} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Setting groups ── */}
        {groups.map((group, gIdx) => (
          <Animated.View
            key={group.title}
            entering={FadeInDown.delay(200 + gIdx * 65).springify()}
            style={styles.group}
          >
            <Text style={[styles.groupLabel, { color: COLORS.text.secondary }]}>
              {group.title.toUpperCase()}
            </Text>
            <View style={[styles.groupCard, { backgroundColor: COLORS.cardBackground }]}>
              {group.rows.map((row, rIdx) => (
                <View key={row.id}>
                  <RowItem
                    row={row}
                    COLORS={COLORS}
                    onPress={row.onPress ?? (() => row.route && router.push(row.route as any))}
                  />
                  {rIdx < group.rows.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: COLORS.text.primary + '09' }]} />
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        ))}

        {/* ── Footer ── */}
        <Animated.View entering={FadeIn.delay(580)} style={styles.footer}>
          <View style={[styles.footerPill, { backgroundColor: COLORS.cardBackground }]}>
            <Shield size={11} color={COLORS.text.light} />
            <Text style={[styles.footerTxt, { color: COLORS.text.light }]}>
              Jahera · v1.0.0 · End-to-end encrypted
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: 120,
    gap: SPACING.md,
  },

  pageHeader: { paddingTop: SPACING.sm, paddingBottom: SPACING.xs },
  pageTitle: {
    fontSize: 30,
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.5,
  },

  /* Hero */
  heroCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xl,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  heroAvatarWrap: { position: 'relative' },
  crownBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  heroInfo: { flex: 1, gap: 3 },
  heroName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroEmail: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.65)',
  },
  heroPlanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.pill,
    marginTop: 2,
  },
  heroPlanText: {
    fontSize: 10,
    fontFamily: FONTS.semibold,
    color: '#F59E0B',
    letterSpacing: 0.2,
  },
  heroEditBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  heroEditText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semibold,
    color: '#FFFFFF',
  },
  heroStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  heroStatVal: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  heroStatLbl: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroStatDiv: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 4,
  },

  /* Upgrade */
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.md,
    ...SHADOWS.md,
  },
  upgradeIconBox: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBody: { flex: 1 },
  upgradeTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  upgradeSub: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.78)',
  },
  upgradeArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Groups */
  group: { gap: 6 },
  groupLabel: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
    letterSpacing: 1.1,
    paddingLeft: SPACING.sm,
  },
  groupCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  /* Rows */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 13,
    gap: SPACING.md,
    minHeight: 54,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 1 },
  rowLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
    letterSpacing: -0.1,
  },
  rowSub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  rowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  divider: {
    height: 1,
    marginLeft: 34 + SPACING.md + SPACING.lg,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: BORDER_RADIUS.pill,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* Footer */
  footer: { alignItems: 'center', paddingTop: SPACING.md },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
  },
  footerTxt: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    letterSpacing: 0.2,
  },
});
