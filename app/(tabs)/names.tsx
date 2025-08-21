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
import { ChevronDown, UserPlus, TriangleAlert as AlertTriangle } from 'lucide-react-native';

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

export default function AddNamesScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [personName, setPersonName] = useState('');
  const [nameEntries, setNameEntries] = useState<NameEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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

  const checkNameExists = (name: string): NameEntry | null => {
    return nameEntries.find(entry => 
      entry.name.toLowerCase().trim() === name.toLowerCase().trim()
    ) || null;
  };

  const addName = async () => {
    if (!personName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال الاسم');
      return;
    }

    if (!selectedActivity) {
      Alert.alert('خطأ', 'يرجى اختيار النشاط');
      return;
    }

    // Check if name already exists
    const existingEntry = checkNameExists(personName.trim());
    if (existingEntry) {
      Alert.alert(
        'اسم مكرر',
        `الاسم "${personName.trim()}" موجود بالفعل تحت النشاط: "${existingEntry.activityName}" (الكود: ${existingEntry.activityCode})`,
        [{ text: 'موافق', style: 'default' }]
      );
      return;
    }

    // Count existing names for this activity to generate sequential number
    const existingNamesForActivity = nameEntries.filter(entry => 
      entry.activityCode.startsWith(selectedActivity.code)
    ).length;
    
    const sequentialCode = `${selectedActivity.code}${existingNamesForActivity + 1}`;

    setIsLoading(true);

    const newEntry: NameEntry = {
      id: Date.now().toString(),
      name: personName.trim(),
      activityCode: sequentialCode,
      activityName: selectedActivity.name,
      timestamp: new Date().toISOString(),
    };

    const updatedEntries = [...nameEntries, newEntry];

    try {
      await AsyncStorage.setItem('nameEntries', JSON.stringify(updatedEntries));
      setNameEntries(updatedEntries);
      setPersonName('');
      Alert.alert('تم', 'تم إضافة الاسم بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في حفظ الاسم');
      console.error('Error saving name:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>إضافة أسماء</Text>
        <Text style={styles.subtitle}>اختر النشاط وأضف الأسماء</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>النشاط</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={[styles.dropdownText, !selectedActivity && styles.placeholderText]}>
              {selectedActivity ? `${selectedActivity.name} (${selectedActivity.code})` : 'اختر النشاط'}
            </Text>
            <ChevronDown size={20} color="#6b7280" />
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownList}>
              {activities.length === 0 ? (
                <View style={styles.emptyDropdown}>
                  <AlertTriangle size={20} color="#f59e0b" />
                  <Text style={styles.emptyDropdownText}>لا توجد أنشطة محفوظة</Text>
                  <Text style={styles.emptyDropdownSubtext}>أضف نشاط أولاً من التبويب الأول</Text>
                </View>
              ) : (
                activities.map((activity) => (
                  <TouchableOpacity
                    key={activity.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedActivity(activity);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{activity.name}</Text>
                    <Text style={styles.dropdownItemCode}>({activity.code})</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>الاسم</Text>
          <TextInput
            style={styles.input}
            value={personName}
            onChangeText={setPersonName}
            placeholder="أدخل الاسم"
            textAlign="right"
          />
        </View>

        <TouchableOpacity
          style={[styles.addButton, isLoading && styles.disabledButton]}
          onPress={addName}
          disabled={isLoading || !selectedActivity}
        >
          <UserPlus size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>
            {isLoading ? 'جاري الإضافة...' : 'إضافة الاسم'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentEntries}>
        <Text style={styles.sectionTitle}>الأسماء المضافة مؤخراً</Text>
        
        {nameEntries.slice(-5).reverse().map((entry) => (
          <View key={entry.id} style={styles.entryCard}>
            <View style={styles.entryInfo}>
              <Text style={styles.entryName}>{entry.name}</Text>
              <Text style={styles.entryActivity}>
                {entry.activityName} ({entry.activityCode})
              </Text>
            </View>
            <Check size={16} color="#059669" />
          </View>
        ))}

        {nameEntries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>لم يتم إضافة أي أسماء بعد</Text>
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
    backgroundColor: '#059669',
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
    color: '#86efac',
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
    position: 'relative',
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
  dropdown: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f9fafb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
    textAlign: 'right',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'right',
    marginBottom: 4,
  },
  dropdownItemCode: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
  },
  emptyDropdown: {
    padding: 20,
    alignItems: 'center',
  },
  emptyDropdownText: {
    fontSize: 16,
    color: '#f59e0b',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  emptyDropdownSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  recentEntries: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'right',
  },
  entryCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'right',
    marginBottom: 4,
  },
  entryActivity: {
    fontSize: 14,
    color: '#6b7280',
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
});