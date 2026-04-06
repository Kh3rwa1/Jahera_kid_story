import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  useWindowDimensions,
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
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { useEntranceSequence, usePulse } from '@/utils/animations';
import { FloatingParticles } from '@/components/FloatingParticles';
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
import { useUI } from '@/contexts/UIContext';
import { BREAKPOINTS, LAYOUT, SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '@/constants/theme';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { MeshBackground } from '@/components/MeshBackground';
import { hapticFeedback } from '@/utils/haptics';
import { Gift, Heart, HelpCircle, MessageCircle, Share2, Sparkles, Trophy } from 'lucide-react-native';

interface SettingRow {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  iconGradient: readonly [string, string];
  route?: string;
  onPress?: () => void;
  badge?: string;
  badgeColor?: string;
  destructive?: boolean;
}

interface SettingGroup {
  title: string;
  emoji: string;
  rows: SettingRow[];
}

function RowItem({ row, COLORS, onPress, rowIndex, styles }: { row: SettingRow; COLORS: any; onPress: () => void; rowIndex: number; styles: any }) {
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const rowStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));

  const handlePressIn = () => {
    hapticFeedback.selection();
    scale.value = withSpring(0.97, { damping: 18 });
    iconScale.value = withSequence(
      withSpring(0.85, { damping: 10, stiffness: 200 }),
      withSpring(1.1, { damping: 8, stiffness: 180 })
    );
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
    iconScale.value = withSpring(1, { damping: 12 });
  };

  return (
    <Animated.View style={rowStyle}>
      <TouchableOpacity
        onPress={() => {
          hapticFeedback.medium();
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.row}
      >
        <Animated.View style={iconStyle}>
          <LinearGradient
            colors={row.destructive ? [COLORS.error + '40', COLORS.error + '20'] : row.iconGradient}
            style={styles.rowIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {row.icon}
          </LinearGradient>
        </Animated.View>
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
            <ChevronRight size={14} color={COLORS.text.light} strokeWidth={3} />
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
  
  const crownPulseStyle = usePulse(0.9, 1.1);
  const { clearProfile, profile, stories } = useApp();
  const { wakeUI } = useUI();
  const COLORS = currentTheme.colors;
  const { width: winWidth } = useWindowDimensions();
  const isTablet = winWidth >= BREAKPOINTS.tablet;
  const isDesktop = winWidth >= BREAKPOINTS.desktop;
  const styles = useStyles(isTablet, isDesktop);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    hapticFeedback.warning();
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
          hapticFeedback.success();
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
      emoji: '🧒',
      rows: [
        {
          id: 'edit-profile',
          label: 'Edit Profile',
          sublabel: profile?.kid_name ? `${profile.kid_name}'s profile` : 'Update name & avatar',
          icon: <UserCog size={24} color="#FFFFFF" strokeWidth={2} />,
          iconGradient: ['#3B82F6', '#2563EB'],
          route: '/settings/edit-profile',
        },
        {
          id: 'languages',
          label: 'Languages',
          sublabel: profile?.languages?.length
            ? `${profile.languages.length} active`
            : 'Add learning languages',
          icon: <Globe size={24} color="#FFFFFF" strokeWidth={2} />,
          iconGradient: ['#10B981', '#059669'],
          route: '/settings/edit-profile',
        },
      ],
    },
    {
      title: 'Appearance',
      emoji: '🎨',
      rows: [
        {
          id: 'customization',
          label: 'Themes & Colors',
          sublabel: 'Personalize your world',
          icon: <Palette size={24} color="#FFFFFF" strokeWidth={2} />,
          iconGradient: ['#F59E0B', '#D97706'],
          route: '/settings/customization',
        },
      ],
    },
    {
      title: 'Account',
      emoji: '🔐',
      rows: [
        {
          id: 'signout',
          label: signingOut ? 'Signing out…' : 'Sign Out',
          icon: <LogOut size={24} color={COLORS.error} strokeWidth={2} />,
          iconGradient: [COLORS.error + '30', COLORS.error + '15'],
          destructive: true,
          onPress: handleSignOut,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
      <MeshBackground primaryColor={COLORS.primary} />
      <FloatingParticles count={15} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} onScroll={wakeUI} scrollEventThrottle={16}>


        {/* ── Hero Glasmorphic Card ── */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={[styles.heroGlass, { backgroundColor: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.3)' }]}>
            <LinearGradient
              colors={[COLORS.primary + '15', COLORS.primary + '05']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            
            <View style={styles.heroTop}>
              <View style={styles.heroAvatarWrap}>
                <ProfileAvatar
                  avatarUrl={profile?.avatar_url ?? null}
                  name={profile?.kid_name ?? user?.email ?? '?'}
                  size="medium"
                  editable={false}
                />
                <Animated.View style={[styles.crownBadge, { backgroundColor: COLORS.primary }, crownPulseStyle]}>
                   <Crown size={10} color="#FFFFFF" fill="#FFFFFF" />
                </Animated.View>
              </View>

              <View style={styles.heroInfo}>
                <Text style={[styles.heroName, { color: COLORS.text.primary }]} numberOfLines={1}>
                  {profile?.kid_name || 'Your Profile'}
                </Text>
                <Text style={[styles.heroEmail, { color: COLORS.text.secondary }]} numberOfLines={1}>
                  {user?.email || ''}
                </Text>
                <View style={[styles.heroPlanPill, { backgroundColor: COLORS.primary + '15' }]}>
                  <Zap size={10} color={COLORS.primary} fill={COLORS.primary} />
                  <Text style={[styles.heroPlanText, { color: COLORS.primary }]}>Explorer Plan</Text>
                </View>
              </View>
            </View>

            <View style={[styles.heroStats, { borderTopColor: 'rgba(0,0,0,0.06)' }]}>
              {[
                { icon: <BookOpen size={13} color={COLORS.primary} />, value: String(stories.length), label: 'Stories' },
                { icon: <Star size={13} color={COLORS.primary} />, value: String(profile?.languages?.length ?? 0), label: 'Active' },
                { icon: <Zap size={13} color={COLORS.primary} />, value: 'Free', label: 'Plan' },
              ].map((stat, i, arr) => (
                <React.Fragment key={stat.label}>
                  <View style={styles.heroStat}>
                    <View style={[styles.heroStatIcon, { backgroundColor: COLORS.primary + '12' }]}>{stat.icon}</View>
                    <Text style={[styles.heroStatVal, { color: COLORS.text.primary }]}>{stat.value}</Text>
                    <Text style={[styles.heroStatLbl, { color: COLORS.text.light }]}>{stat.label}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={[styles.heroStatDiv, { backgroundColor: 'rgba(0,0,0,0.08)' }]} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ── Upgrade Premium Card ── */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <TouchableOpacity 
            onPress={() => {
              hapticFeedback.medium();
              router.push('/paywall');
            }} 
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#F59E0B', '#EF4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.premiumBanner}
            >
              <View style={styles.premiumIconBox}>
                <Crown size={24} color="#F59E0B" fill="#F59E0B" />
              </View>
              <View style={styles.premiumBody}>
                <Text style={styles.premiumTitle}>Unlock Premium Magic ✨</Text>
                <Text style={styles.premiumDesc}>Unlimited worlds · High-fidelity voices</Text>
              </View>
              <View style={styles.premiumAction}>
                <Text style={styles.premiumActionText}>UPGRADE</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Referral Card ── */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.referralCard}>
          <View style={[styles.referralInner, { backgroundColor: '#FFF', borderColor: 'rgba(0,0,0,0.05)' }]}>
            <LinearGradient
              colors={['#DB2777' + '15', '#DB2777' + '05']}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.referralIcon, { backgroundColor: '#DB2777' + '20' }]}>
              <Gift size={22} color="#DB2777" />
            </View>
            <View style={styles.referralContent}>
              <Text style={[styles.referralTitle, { color: COLORS.text.primary }]}>Spread the Magic</Text>
              <Text style={[styles.referralSub, { color: COLORS.text.secondary }]}>Invite a friend and unlock 2 bonus stories!</Text>
            </View>
            <TouchableOpacity 
              style={[styles.referralBtn, { backgroundColor: '#DB2777' }]}
              onPress={() => hapticFeedback.selection()}
            >
              <Share2 size={16} color="#FFFFFF" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Setting groups ── */}
        {groups.map((group, gIdx) => (
          <Animated.View
            key={group.title}
            entering={FadeInDown.delay(350 + gIdx * 100).springify()}
            style={styles.group}
          >
            <View style={styles.groupLabelRow}>
              <Text style={styles.groupEmoji}>{group.emoji}</Text>
              <Text style={[styles.groupLabel, { color: COLORS.text.light }]}>
                {group.title.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.groupCard, { backgroundColor: '#FFF', borderColor: 'rgba(0,0,0,0.05)', borderWidth: 1 }]}>
              {group.rows.map((row, rIdx) => (
                <View key={row.id}>
                  <RowItem
                    row={row}
                    COLORS={COLORS}
                    styles={styles}
                    onPress={row.onPress ?? (() => row.route && router.push(row.route as any))}
                    rowIndex={rIdx}
                  />
                  {rIdx < group.rows.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: 'rgba(0,0,0,0.05)' }]} />
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        ))}

        {/* ── Support & Love Card ── */}
        <Animated.View entering={FadeInDown.delay(550).springify()} style={styles.supportCard}>
          <View style={[styles.supportInner, { backgroundColor: 'rgba(255,255,255,0.5)', borderColor: 'rgba(0,0,0,0.05)' }]}>
            <View style={styles.supportHeader}>
              <View style={[styles.supportIconWrap, { backgroundColor: COLORS.primary }]}>
                 <MessageCircle size={18} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={[styles.supportTitle, { color: COLORS.text.primary }]}>Need help?</Text>
            </View>
            <Text style={[styles.supportDesc, { color: COLORS.text.secondary }]}>
              Have a suggestion or found a bug? We'd love to hear from you!
            </Text>
            <TouchableOpacity 
              style={[styles.supportBtn, { backgroundColor: COLORS.primary }]}
              onPress={() => hapticFeedback.light()}
            >
              <Text style={styles.supportBtnText}>Chat with us</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Wisdom Chip ── */}
        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.wisdomCard}>
          <View style={[styles.wisdomBubble, { backgroundColor: '#FFF', borderColor: 'rgba(0,0,0,0.05)' }]}>
            <Heart size={20} color="#EF4444" fill="#EF4444" />
            <Text style={[styles.wisdomText, { color: COLORS.text.secondary }]}>
              "Daily reading for 15 minutes boosts vocabulary by 50% in children."
            </Text>
            <View style={[styles.wisdomTail, { borderTopColor: '#FFF' }]} />
          </View>
          <View style={styles.wisdomAuthor}>
            <Sparkles size={12} color="#F59E0B" />
            <Text style={styles.wisdomAuthorText}>PARENTHOOD TIP</Text>
          </View>
        </Animated.View>

        {/* ── Footer ── */}
        <Animated.View entering={FadeIn.delay(700)} style={styles.footer}>
          <View style={[styles.footerPill, { backgroundColor: 'rgba(255,255,255,0.4)', borderColor: 'rgba(0,0,0,0.05)', borderWidth: 1 }]}>
            <Shield size={12} color={COLORS.text.light} />
            <Text style={[styles.footerTxt, { color: COLORS.text.light }]}>
              Jahera Kid Adventure · v1.0.0
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = (isTablet: boolean, isDesktop: boolean) => {
  return useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    scroll: {
      paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl,
      paddingTop: SPACING.sm,
      paddingBottom: 140,
      gap: isTablet ? SPACING.xxl : SPACING.xl,
      width: '100%',
      maxWidth: isDesktop ? 1040 : LAYOUT.maxWidth + 120,
      alignSelf: 'center',
    },

    pageHeader: { paddingTop: SPACING.xs, paddingBottom: 0 },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pageTitleEmoji: { fontSize: isTablet ? 28 : 24 },
    pageTitle: {
    fontSize: isTablet ? 40 : 34,
    fontFamily: FONTS.display,
    letterSpacing: -0.6,
    },

  heroGlass: {
    borderRadius: BORDER_RADIUS.xxl + 4,
    overflow: 'hidden',
    borderWidth: 1,
    ...(Platform.OS === 'ios' ? SHADOWS.md : {}),
  },
    heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isTablet ? SPACING.xxl : SPACING.xl,
    paddingBottom: isTablet ? SPACING.xl : SPACING.lg,
    gap: SPACING.lg,
    },
  heroAvatarWrap: { position: 'relative' },
    crownBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: isTablet ? 28 : 22,
    height: isTablet ? 28 : 22,
    borderRadius: isTablet ? 14 : 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...SHADOWS.sm,
    },
    heroInfo: { flex: 1, gap: 2 },
    heroName: {
    fontSize: isTablet ? 28 : 22,
    fontFamily: FONTS.display,
    letterSpacing: -0.4,
  },
    heroEmail: {
    fontSize: isTablet ? 14 : 12,
    fontFamily: FONTS.medium,
    opacity: 0.8,
  },
  heroPlanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill,
    marginTop: 4,
  },
    heroPlanText: {
    fontSize: isTablet ? 11 : 10,
    fontFamily: FONTS.extrabold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroEditBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.pill,
    ...SHADOWS.sm,
  },
  heroEditText: {
    fontSize: 13,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
  },
    heroStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    marginHorizontal: isTablet ? SPACING.xxl : SPACING.xl,
    paddingVertical: isTablet ? SPACING.xxl : SPACING.xl,
    },
  heroStat: { flex: 1, alignItems: 'center', gap: 4 },
    heroStatIcon: {
    width: isTablet ? 40 : 32,
    height: isTablet ? 40 : 32,
    borderRadius: isTablet ? 20 : 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
    heroStatVal: {
    fontSize: isTablet ? 24 : 18,
    fontFamily: FONTS.display,
    letterSpacing: -0.2,
  },
    heroStatLbl: {
    fontSize: isTablet ? 11 : 10,
    fontFamily: FONTS.extrabold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroStatDiv: {
    width: 1,
    marginVertical: 8,
    borderRadius: 0.5,
  },

    premiumBanner: {
    padding: isTablet ? SPACING.xxl : SPACING.xl, 
    borderRadius: BORDER_RADIUS.xxl + 4,
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.lg,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
    premiumIconBox: {
    width: isTablet ? 56 : 48, height: isTablet ? 56 : 48, borderRadius: isTablet ? 20 : 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  premiumBody: { flex: 1, gap: 2 },
    premiumTitle: {
    fontSize: isTablet ? 24 : 20, fontFamily: FONTS.display,
    color: '#FFFFFF', letterSpacing: -0.3,
  },
    premiumDesc: { fontSize: isTablet ? 16 : 14, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.9)' },
  premiumAction: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#FFF', borderRadius: BORDER_RADIUS.pill,
    ...SHADOWS.sm,
  },
  premiumActionText: { fontSize: 13, fontFamily: FONTS.extrabold, color: '#F59E0B' },

  referralCard: { width: '100%' },
    referralInner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.lg,
    padding: isTablet ? SPACING.xxl : SPACING.xl, borderRadius: 28,
    overflow: 'hidden', borderWidth: 1, ...SHADOWS.sm,
  },
    referralIcon: {
    width: isTablet ? 66 : 58, height: isTablet ? 66 : 58, borderRadius: isTablet ? 33 : 29,
    alignItems: 'center', justifyContent: 'center',
  },
  referralContent: { flex: 1, gap: 2 },
    referralTitle: { fontSize: isTablet ? 22 : 18, fontFamily: FONTS.display, letterSpacing: -0.3 },
    referralSub: { fontSize: isTablet ? 15 : 13, fontFamily: FONTS.medium, lineHeight: isTablet ? 21 : 18 },
  referralBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm,
  },

  wisdomCard: { alignItems: 'center', marginVertical: SPACING.lg, gap: SPACING.sm },
    wisdomBubble: {
    padding: isTablet ? 24 : 20,
    borderRadius: 24, width: '100%',
    flexDirection: 'row', alignItems: 'center', gap: SPACING.lg,
    borderWidth: 1, ...SHADOWS.sm,
  },
    wisdomText: { flex: 1, fontSize: isTablet ? 16 : 14, fontFamily: FONTS.medium, lineHeight: isTablet ? 24 : 22 },
  wisdomTail: {
    position: 'absolute', bottom: -10, left: '50%', marginLeft: -10,
    width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10,
    borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  wisdomAuthor: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wisdomAuthorText: { fontSize: 10, fontFamily: FONTS.extrabold, color: '#94A3B8', letterSpacing: 1.2 },

  group: { gap: 10 },
  groupLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: SPACING.md },
  groupEmoji: { fontSize: 22 },
    groupLabel: {
    fontSize: isTablet ? 16 : 15,
    fontFamily: FONTS.extrabold,
    letterSpacing: 0.8,
  },
  groupCard: {
    borderRadius: 28,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },

    row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl,
    paddingVertical: isTablet ? 24 : 20,
    gap: SPACING.lg,
    minHeight: isTablet ? 94 : 82,
    },
    rowIcon: {
    width: isTablet ? 62 : 54,
    height: isTablet ? 62 : 54,
    borderRadius: isTablet ? 22 : 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
    rowLabel: {
    fontSize: isTablet ? 21 : 18,
    fontFamily: FONTS.bold,
    letterSpacing: -0.3,
  },
    rowSub: {
    fontSize: isTablet ? 16 : 14,
    fontFamily: FONTS.medium,
    opacity: 0.75,
  },
  rowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
    divider: {
    height: 1,
    marginHorizontal: isTablet ? SPACING.xxl : SPACING.xl,
    },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.pill,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  footer: { alignItems: 'center', paddingVertical: SPACING.xl },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.pill,
  },
  footerTxt: {
    fontSize: 11,
    fontFamily: FONTS.extrabold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  supportCard: { width: '100%' },
    supportInner: {
    padding: isTablet ? 28 : 24, borderRadius: 28,
    gap: 16, borderWidth: 1,
  },
  supportHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  supportIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.sm,
  },
    supportTitle: { fontSize: isTablet ? 22 : 18, fontFamily: FONTS.display, letterSpacing: -0.4 },
    supportDesc: { fontSize: isTablet ? 16 : 14, fontFamily: FONTS.medium, lineHeight: isTablet ? 24 : 22 },
  supportBtn: {
    paddingVertical: 14, borderRadius: BORDER_RADIUS.pill,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.md,
  },
    supportBtnText: { fontSize: isTablet ? 17 : 15, fontFamily: FONTS.extrabold, color: '#FFFFFF' },
  }), [isTablet, isDesktop]);
};
