import { StyleSheet, Platform } from 'react-native';
import { useMemo } from 'react';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS, LAYOUT } from '@/constants/theme';

export const useHomeStyles = (C: any, isTablet: boolean, isDesktop: boolean) => {
  return useMemo(() => StyleSheet.create({
    root: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    loadingWrap: { padding: SPACING.xl, gap: SPACING.xl },

    /* Navigation Bar */
    topBar: {
      paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl,
      paddingTop: isTablet ? SPACING.xl : SPACING.lg,
      paddingBottom: SPACING.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    avatarContainer: { position: 'relative' },
    avatarStatus: {
      position: 'absolute', bottom: 1, right: 1,
      width: 12, height: 12, borderRadius: 6,
      borderWidth: 2, borderColor: '#FFFFFF',
    },
    greetBlock: { gap: 0 },
    greetLine1: { fontSize: isTablet ? 15 : 13, fontFamily: FONTS.displayMedium, opacity: 0.8 },
    greetLine2: { fontSize: isTablet ? 36 : 30, fontFamily: FONTS.display, letterSpacing: -0.8 },
    topBarRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    iconBtn: {
      width: isTablet ? 52 : 44, height: isTablet ? 52 : 44, borderRadius: isTablet ? 26 : 22,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5,
      ...SHADOWS.xs,
    },
    streakChip: {
      paddingHorizontal: 12, paddingVertical: 8,
      borderRadius: BORDER_RADIUS.pill,
      flexDirection: 'row', alignItems: 'center',
      ...SHADOWS.xs,
    },
    streakChipText: { fontSize: 16, fontFamily: FONTS.displayBold, color: '#F97316' },

    /* Hero Section */
    heroWrap: { 
      paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl, 
      marginBottom: isTablet ? SPACING.xxxl : SPACING.xxl, 
      marginTop: isTablet ? SPACING.xl : SPACING.md,
      maxWidth: LAYOUT.maxWidth,
      alignSelf: 'center',
      width: '100%',
    },
    heroCard: {
      borderRadius: 36,
      minHeight: isTablet ? 300 : 220,
      overflow: 'hidden',
      position: 'relative',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.15)',
      ...SHADOWS.lg,
    },
    orb: { position: 'absolute', borderRadius: 999 },
    orbTL: { width: 160, height: 160, top: -40, left: -40 },
    orbBR: { width: 200, height: 200, bottom: -60, right: -60 },
    heroBodyInner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: isTablet ? SPACING.xxxl + 8 : SPACING.xxl,
      paddingBottom: isTablet ? SPACING.xxl : SPACING.lg,
      gap: isTablet ? SPACING.xxl : SPACING.lg,
      zIndex: 2,
    },
    heroMain: { flex: 1, gap: isTablet ? SPACING.md : SPACING.sm },
    heroBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: BORDER_RADIUS.pill,
      backgroundColor: 'rgba(255,255,255,0.22)',
      alignSelf: 'flex-start',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
      marginBottom: 4,
    },
    heroBadgeText: { fontSize: isTablet ? 12 : 10, fontFamily: FONTS.displayBold, color: '#FFFFFF', letterSpacing: 0.5, textTransform: 'uppercase' },
    heroH1: { fontSize: isTablet ? 56 : 42, fontFamily: FONTS.display, color: '#FFFFFF', letterSpacing: -1.2, lineHeight: isTablet ? 56 : 42 },
    heroSub: { fontSize: isTablet ? 18 : 15, fontFamily: FONTS.displayMedium, color: 'rgba(255,255,255,0.92)', lineHeight: isTablet ? 24 : 20 },
    heroActionBtn: {
      marginTop: 12,
      alignSelf: 'flex-start',
      ...SHADOWS.lg,
    },
    heroActionInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: isTablet ? 28 : 22,
      paddingVertical: isTablet ? 16 : 13,
      borderRadius: BORDER_RADIUS.pill,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.8)',
    },
    heroActionBtnText: { fontSize: isTablet ? 18 : 16, fontFamily: FONTS.displayBold, color: '#0F172A' },
    heroVisual: { 
      alignItems: 'center', 
      justifyContent: 'center', 
      paddingRight: isTablet ? 20 : 0 
    },
    heroVisualOutline: {
      width: isTablet ? 160 : 120,
      height: isTablet ? 160 : 120,
      borderRadius: isTablet ? 80 : 60,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroLargeEmoji: { fontSize: isTablet ? 80 : 64 },
    heroSparkleTrack: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center' },
    heroSpk: { fontSize: isTablet ? 28 : 20, position: 'absolute', top: 0, right: -15 },
    heroStrip: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: isTablet ? SPACING.xxxl : SPACING.xxl, paddingVertical: 14,
      gap: SPACING.lg,
      zIndex: 1,
    },
    heroStripItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    heroStripText: { fontSize: isTablet ? 14 : 13, fontFamily: FONTS.displayMedium, color: 'rgba(255,255,255,0.85)' },
    heroStripDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },

    /* Quick actions */
    quickWrapper: {
      marginHorizontal: isTablet ? SPACING.xxl : SPACING.xl,
      marginBottom: isTablet ? SPACING.xxxl : SPACING.xxl,
      position: 'relative',
    },
    quickBg: {
      position: 'absolute',
      left: 0, right: 0, top: 0, bottom: 0,
      borderRadius: BORDER_RADIUS.xxl,
      borderWidth: 1.5,
      ...SHADOWS.sm,
    },
    quickRow: {
      flexDirection: 'row',
      paddingVertical: isTablet ? SPACING.xl : SPACING.lg,
      paddingHorizontal: isTablet ? SPACING.xl : SPACING.md,
      gap: isTablet ? SPACING.xl : SPACING.xs,
    },
    quickItem: { flex: 1 },
    quickCard: {
      alignItems: 'center',
      gap: isTablet ? 12 : 8,
      paddingVertical: SPACING.md,
    },
    quickIconCircle: {
      width: isTablet ? 72 : 60, height: isTablet ? 72 : 60, borderRadius: isTablet ? 36 : 30,
      alignItems: 'center', justifyContent: 'center',
      ...SHADOWS.md,
    },
    quickLabel: { fontSize: isTablet ? 17 : 16, fontFamily: FONTS.displayBold, textAlign: 'center' },
    quickSublabel: { fontSize: isTablet ? 13 : 12, fontFamily: FONTS.displayMedium, textAlign: 'center', opacity: 0.7 },

    /* Stats Ticker */
    statsTickerWrapper: {
      overflow: 'hidden',
      marginBottom: isTablet ? SPACING.xxxl : SPACING.xxl,
      height: isTablet ? 90 : 70,
      justifyContent: 'center',
    },
    statsTickerTrack: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      paddingHorizontal: SPACING.md,
    },
    statsTickerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: isTablet ? 28 : 20,
      paddingVertical: isTablet ? 18 : 14,
      borderRadius: BORDER_RADIUS.pill,
      gap: 12,
      ...SHADOWS.sm,
    },
    statsTickerIcon: {
      width: isTablet ? 44 : 34, height: isTablet ? 44 : 34, borderRadius: isTablet ? 22 : 17,
      alignItems: 'center', justifyContent: 'center',
    },
    statsTickerVal: { fontSize: isTablet ? 24 : 20, fontFamily: FONTS.display, letterSpacing: -0.3 },
    statsTickerLbl: { fontSize: isTablet ? 16 : 14, fontFamily: FONTS.displayMedium },

    /* Discovery Section */
    discoverySection: { marginBottom: isTablet ? SPACING.xxl : SPACING.xl + 4 },
    discoveryTitle: { 
      fontSize: isTablet ? 15 : 14, 
      fontFamily: FONTS.displayBold, 
      paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl, 
      marginBottom: SPACING.md, 
      letterSpacing: 1.2, 
      opacity: 0.8 
    },
    discoveryScroll: { paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl, gap: SPACING.md },
    discoveryChip: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: isTablet ? 22 : 18, paddingVertical: isTablet ? 18 : 16,
      borderRadius: BORDER_RADIUS.pill,
      borderWidth: 1.5,
      ...SHADOWS.sm,
      // Frosted glass effect
      ...(Platform.OS !== 'web' ? { shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 } : {}),
    },
    discoveryEmoji: { fontSize: isTablet ? 24 : 22 },
    discoveryLabel: { fontSize: isTablet ? 18 : 16, fontFamily: FONTS.displayBold },

    /* Sections */
    section: { marginBottom: isTablet ? SPACING.xxxl : SPACING.xxl },
    secHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl, marginBottom: SPACING.lg,
    },
    secTitle: { fontSize: isTablet ? 32 : 28, fontFamily: FONTS.display, letterSpacing: -0.6 },
    seeAllBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 16, paddingVertical: 9, borderRadius: BORDER_RADIUS.pill,
    },
    seeAllText: { fontSize: 15, fontFamily: FONTS.displayBold },

    /* Carousel */
    carousel: { paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl, gap: SPACING.md },
    storyCard: {
      borderRadius: 28, overflow: 'hidden', ...SHADOWS.md,
      borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)',
    },
    storyArt: { width: '100%', height: isTablet ? 170 : 155, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    storyArtEmoji: { fontSize: isTablet ? 80 : 68 },
    storyBadgesTop: { position: 'absolute', top: 12, left: 12 },
    storyFlagBadge: { width: isTablet ? 44 : 36, height: isTablet ? 44 : 36, borderRadius: isTablet ? 22 : 18, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', ...SHADOWS.xs },
    storyFlag: { fontSize: isTablet ? 22 : 18 },
    storyPlayBtn: {
      position: 'absolute', bottom: 12, right: 12,
      width: isTablet ? 44 : 36, height: isTablet ? 44 : 36, borderRadius: isTablet ? 22 : 18,
      alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm,
    },
    storyContent: { padding: SPACING.lg, gap: 8 },
    storyTitle: { fontSize: isTablet ? 20 : 18, fontFamily: FONTS.displayBold, lineHeight: isTablet ? 26 : 24 },
    storyMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    seasonTag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: BORDER_RADIUS.pill },
    seasonTagText: { fontSize: 13, fontFamily: FONTS.displayBold },
    storyMetaText: { fontSize: 13, fontFamily: FONTS.displayMedium },

    /* Empty state */
    emptyWrap: { paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl },
    emptyCard: { borderRadius: 32, padding: isTablet ? 60 : SPACING.xxxl, alignItems: 'center', gap: SPACING.lg, ...SHADOWS.sm, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
    emptyIconRing: { width: isTablet ? 120 : 90, height: isTablet ? 120 : 90, borderRadius: isTablet ? 60 : 45, backgroundColor: '#FFF9E6', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FBBF2430' },
    emptyEmoji: { fontSize: isTablet ? 60 : 44 },
    emptyTitle: { fontSize: isTablet ? 32 : 24, fontFamily: FONTS.display, letterSpacing: -0.5 },
    emptySub: { fontSize: isTablet ? 18 : 14, fontFamily: FONTS.displayMedium, textAlign: 'center', lineHeight: isTablet ? 26 : 22, opacity: 0.7 },
    emptyAction: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 32, paddingVertical: 18, borderRadius: BORDER_RADIUS.pill, marginTop: 12, ...SHADOWS.md },
    emptyActionText: { fontSize: 18, fontFamily: FONTS.displayBold, color: '#FFFFFF' },

    /* Premium Banner */
    premiumBannerWrap: { paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl, marginBottom: SPACING.xxxl },
    premiumBanner: {
      borderRadius: 24, padding: isTablet ? SPACING.xxl : SPACING.xl, overflow: 'hidden', ...SHADOWS.lg,
    },
    premiumGlowRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
    premiumIconBox: { width: isTablet ? 64 : 50, height: isTablet ? 64 : 50, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    premiumBody: { flex: 1, gap: 4 },
    premiumTitle: { fontSize: isTablet ? 24 : 18, fontFamily: FONTS.display, color: '#FFFFFF' },
    premiumDesc: { fontSize: isTablet ? 14 : 12, fontFamily: FONTS.displayMedium, color: 'rgba(255,255,255,0.7)', lineHeight: 18 },
    premiumAction: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: BORDER_RADIUS.pill },
    premiumActionText: { fontSize: 13, fontFamily: FONTS.extrabold, color: '#0F172A' },

    shimmerOverlay: {
      position: 'absolute', top: 0, bottom: 0, width: 80,
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
  }), [C, isTablet, isDesktop]);
};
