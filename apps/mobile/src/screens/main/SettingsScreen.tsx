// ============================================================================
// File: apps/mobile/src/screens/main/SettingsScreen.tsx
// ============================================================================

import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

export function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('') || 'IM';

  function handleLogout() {
    Alert.alert('خروج', 'آیا مطمئن هستید؟', [
      { text: 'انصراف', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: () => { void logout(); } },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.label}>حساب کاربری</Text>
        <Text style={styles.title}>تنظیمات</Text>

        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.firstName ?? ''} {user?.lastName ?? ''}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role}</Text>
            </View>
          </View>
        </View>

        {/* Menu items */}
        {[
          { label: 'اعلان‌ها', icon: '🔔' },
          { label: 'زبان', icon: '🌍' },
          { label: 'حریم خصوصی', icon: '🔒' },
          { label: 'درباره iMedica', icon: 'ℹ️' },
        ].map((item) => (
          <View key={item.label} style={styles.menuItem}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuSoon}>به زودی</Text>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>خروج از حساب</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: '600', color: '#16a34a', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#14532d', marginBottom: 20 },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#16a34a' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  profileEmail: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  roleBadge: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  roleText: { fontSize: 11, fontWeight: '600', color: '#16a34a' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#374151' },
  menuSoon: { fontSize: 12, color: '#9ca3af' },
  logoutBtn: {
    marginTop: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#dc2626' },
});
