// ============================================================================
// File: apps/mobile/src/screens/main/ProgressScreen.tsx
// ============================================================================

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ProgressScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.label}>پیشرفت</Text>
        <Text style={styles.title}>وضعیت آموزشی</Text>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📈</Text>
          <Text style={styles.emptyTitle}>داده‌ای موجود نیست</Text>
          <Text style={styles.emptyText}>پس از اتمام سناریوها، پیشرفت شما اینجا نمایش داده می‌شود</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  scroll: { flex: 1 },
  content: { padding: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#16a34a', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#14532d', marginBottom: 24 },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});
