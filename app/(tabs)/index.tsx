import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  I18nManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, Check } from 'lucide-react-native';

// Enable RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

interface Activity {
  id: string;
  name: string;
  code: string;
}

export default function AddActivityScreen() {
  const [activityName, setActivityName] = useState('');
  const [activityCode, setActivityCode] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const savedActivities = await AsyncStorage.getItem('activities');
      if (savedActivities) {
        setActivities(JSON.parse(savedActivities));
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const saveActivity = async () => {
    if (!activityName.trim() || !activityCode.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم النشاط والكود');
      return;
    }

    // Check if code already exists
    const codeExists = activities.some(activity => activity.code === activityCode.trim());
    if (codeExists) {
      Alert.alert('خطأ', 'هذا الكود موجود بالفعل');
      return;
    }

    setIsLoading(true);

    const newActivity: Activity = {
      id: Date.now().toString(),
      name: activityName.trim(),
      code: activityCode.trim(),
    };

    const updatedActivities = [...activities, newActivity];

    try {
      await AsyncStorage.setItem('activities', JSON.stringify(updatedActivities));
      setActivities(updatedActivities);
      setActivityName('');
      setActivityCode('');
      Alert.alert('تم', 'تم إضافة النشاط بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في حفظ النشاط');
      console.error('Error saving activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteActivity = async (id: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا النشاط؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            const updatedActivities = activities.filter(activity => activity.id !== id);
            try {
              await AsyncStorage.setItem('activities', JSON.stringify(updatedActivities));
              setActivities(updatedActivities);
            } catch (error) {
              Alert.alert('خطأ', 'حدث خطأ في حذف النشاط');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>إضافة نشاط جديد</Text>
        <Text style={styles.subtitle}>أضف اسم النشاط والكود الخاص به</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>اسم النشاط</Text>
          <TextInput
            style={styles.input}
            value={activityName}
            onChangeText={setActivityName}
            placeholder="أدخل اسم النشاط"
            textAlign="right"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>كود النشاط</Text>
          <TextInput
            style={styles.input}
            value={activityCode}
            onChangeText={setActivityCode}
            placeholder="أدخل كود النشاط"
            textAlign="right"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.disabledButton]}
          onPress={saveActivity}
          disabled={isLoading}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.saveButtonText}>
            {isLoading ? 'جاري الحفظ...' : 'إضافة النشاط'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.activitiesList}>
        <Text style={styles.sectionTitle}>الأنشطة المحفوظة ({activities.length})</Text>
        
        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>لا توجد أنشطة محفوظة</Text>
          </View>
        ) : (
          activities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>{activity.name}</Text>
                <Text style={styles.activityCode}>الكود: {activity.code}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteActivity(activity.id)}
              >
                <Text style={styles.deleteButtonText}>حذف</Text>
              </TouchableOpacity>
            </View>
          ))
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
    backgroundColor: '#2563eb',
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
    color: '#bfdbfe',
    textAlign: 'right',
  },
  form: {
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#f9fafb',
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  activitiesList: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'right',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'right',
    marginBottom: 4,
  },
  activityCode: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});