import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  I18nManager,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Download, FileSpreadsheet, Trash2, RotateCcw } from 'lucide-react-native';

// Enable RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

interface Activity {
  id: string;
  name: string;
  code: string;
}

interface NameEntry {
  id: string;
  name: string;
  activityCode: string;
  activityName: string;
  timestamp: string;
}

interface ExcelRow {
  activityCode: string;
  name: string;
  activityName: string;
}

export default function DataViewScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [nameEntries, setNameEntries] = useState<NameEntry[]>([]);
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    generateExcelData();
  }, [nameEntries]);

  const loadData = async () => {
    try {
      const [activitiesData, namesData] = await Promise.all([
        AsyncStorage.getItem('activities'),
        AsyncStorage.getItem('nameEntries'),
      ]);

      if (activitiesData) {
        setActivities(JSON.parse(activitiesData));
      }

      if (namesData) {
        setNameEntries(JSON.parse(namesData));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const generateExcelData = () => {
    const data: ExcelRow[] = nameEntries.map(entry => ({
      activityCode: entry.activityCode,
      name: entry.name,
      activityName: entry.activityName,
    }));

    setExcelData(data);
  };

  const exportToExcel = () => {
    if (excelData.length === 0) {
      Alert.alert('تنبيه', 'لا توجد بيانات للتصدير');
      return;
    }

    // Simulate Excel export
    const csvContent = [
      'كود النشاط,الاسم,النشاط',
      ...excelData.map(row => `${row.activityCode},${row.name},${row.activityName}`)
    ].join('\n');

    Alert.alert(
      'تصدير Excel',
      `تم إنشاء ملف Excel بنجاح!\n\nعدد الصفوف: ${excelData.length}\nتاريخ التصدير: ${new Date().toLocaleDateString('ar')}`,
      [
        {
          text: 'عرض محتوى الملف',
          onPress: () => {
            Alert.alert('محتوى ملف Excel', csvContent);
          }
        },
        { text: 'موافق', style: 'default' }
      ]
    );
  };

  const clearAllData = () => {
    Alert.alert(
      'تأكيد المسح',
      'هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف الكل',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all([
                AsyncStorage.removeItem('activities'),
                AsyncStorage.removeItem('nameEntries'),
              ]);
              setActivities([]);
              setNameEntries([]);
              setExcelData([]);
              Alert.alert('تم', 'تم حذف جميع البيانات');
            } catch (error) {
              Alert.alert('خطأ', 'حدث خطأ في حذف البيانات');
            }
          },
        },
      ]
    );
  };

  const getActivityStats = () => {
    const stats: { [key: string]: { count: number; activityName: string; codes: string[] } } = {};
    
    nameEntries.forEach(entry => {
      // Extract base activity code (remove numbers)
      const baseCode = entry.activityCode.replace(/\d+$/, '');
      
      if (!stats[baseCode]) {
        stats[baseCode] = {
          count: 0,
          activityName: entry.activityName,
          codes: [],
        };
      }
      stats[baseCode].count++;
      stats[baseCode].codes.push(entry.activityCode);
    });

    return stats;
  };

  const renderExcelRow = ({ item, index }: { item: ExcelRow; index: number }) => (
    <View style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
      <Text style={[styles.tableCell, styles.codeCell]}>{item.activityCode}</Text>
      <Text style={[styles.tableCell, styles.nameCell]}>{item.name}</Text>
      <Text style={[styles.tableCell, styles.activityCell]}>{item.activityName}</Text>
    </View>
  );

  const stats = getActivityStats();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>عرض البيانات</Text>
        <Text style={styles.subtitle}>جدول البيانات وإحصائيات شاملة</Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>الإحصائيات</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{activities.length}</Text>
            <Text style={styles.statLabel}>عدد الأنشطة</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{nameEntries.length}</Text>
            <Text style={styles.statLabel}>إجمالي الأسماء</Text>
          </View>
        </View>

        {Object.keys(stats).length > 0 && (
          <View style={styles.activityStats}>
            <Text style={styles.statsSubtitle}>توزيع الأسماء حسب النشاط:</Text>
            {Object.entries(stats).map(([code, data]) => (
              <View key={code} style={styles.activityStatRow}>
                <Text style={styles.activityStatName}>{data.activityName}</Text>
                <View style={styles.activityStatDetails}>
                  <Text style={styles.activityStatCount}>{data.count} اسم</Text>
                  <Text style={styles.activityStatCodes}>
                    ({data.codes.sort().join(', ')})
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.exportButton} onPress={exportToExcel}>
          <Download size={20} color="#ffffff" />
          <Text style={styles.exportButtonText}>تصدير Excel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
          <RotateCcw size={20} color="#2563eb" />
          <Text style={styles.refreshButtonText}>تحديث البيانات</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={clearAllData}>
          <Trash2 size={20} color="#ef4444" />
          <Text style={styles.clearButtonText}>مسح جميع البيانات</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tableContainer}>
        <Text style={styles.sectionTitle}>جدول البيانات (نمط Excel)</Text>
        
        {excelData.length === 0 ? (
          <View style={styles.emptyTable}>
            <FileSpreadsheet size={48} color="#9ca3af" />
            <Text style={styles.emptyTableText}>لا توجد بيانات للعرض</Text>
            <Text style={styles.emptyTableSubtext}>أضف أنشطة وأسماء لرؤية الجدول</Text>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.codeCell]}>كود النشاط</Text>
              <Text style={[styles.tableHeaderCell, styles.nameCell]}>الاسم</Text>
              <Text style={[styles.tableHeaderCell, styles.activityCell]}>النشاط</Text>
            </View>
            <FlatList
              data={excelData}
              renderItem={renderExcelRow}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#7c3aed',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#c4b5fd',
    textAlign: 'right',
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 0.48,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  activityStats: {
    marginTop: 16,
  },
  statsSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'right',
  },
  activityStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  activityStatName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    textAlign: 'right',
  },
  activityStatDetails: {
    alignItems: 'flex-end',
  },
  activityStatCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  activityStatCodes: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  actionsContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  exportButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  refreshButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  refreshButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  clearButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  clearButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 40,
  },
  table: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  tableHeader: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowEven: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  codeCell: {
    flex: 1,
    fontWeight: '600',
    color: '#2563eb',
  },
  nameCell: {
    flex: 2,
    fontWeight: '600',
  },
  activityCell: {
    flex: 2,
    color: '#6b7280',
  },
  emptyTable: {
    padding: 60,
    alignItems: 'center',
  },
  emptyTableText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
  emptyTableSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
});