// ============================================================================
// File: apps/mobile/src/screens/main/DashboardScreen.tsx
// ============================================================================

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

export function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'کاربر';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>سلام، {name} 👋</Text>
          <Text style={styles.subtext}>خوش آمدید به iMedica</Text>
        </View>

        {/* Stats */}
        <View style={styles.grid}>
          {[
            { label: 'سناریوهای فعال', value: '—', icon: '📋' },
            { label: 'پیشرفت کلی', value: '—', icon: '📈' },
            { label: 'امتیاز', value: '—', icon: '⭐' },
            { label: 'ارزیابی‌ها', value: '—', icon: '✅' },
          ].map((item) => (
            <View key={item.label} style={styles.card}>
              <Text style={styles.cardIcon}>{item.icon}</Text>
              <Text style={styles.cardValue}>{item.value}</Text>
              <Text style={styles.cardLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent activity placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>آخرین فعالیت‌ها</Text>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>به زودی...</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#14532d' },
  subtext: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  card: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: { fontSize: 24, marginBottom: 8 },
  cardValue: { fontSize: 20, fontWeight: '800', color: '#16a34a' },
  cardLabel: { fontSize: 11, color: '#6b7280', marginTop: 4, textAlign: 'center' },
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderStyle: 'dashed',
  },
  emptyText: { color: '#9ca3af', fontSize: 14 },
});
