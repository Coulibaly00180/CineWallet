import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  IconButton,
  Card,
  Chip
} from 'react-native-paper';

/**
 * Props du composant DatePickerModal
 */
interface DatePickerModalProps {
  /** Modal visible */
  visible: boolean;
  /** Date actuellement sélectionnée */
  selectedDate?: Date;
  /** Callback quand une date est sélectionnée */
  onDateSelect: (date: Date) => void;
  /** Fermeture du modal */
  onDismiss: () => void;
  /** Date minimum sélectionnable */
  minimumDate?: Date;
  /** Date maximum sélectionnable */
  maximumDate?: Date;
  /** Titre du modal */
  title?: string;
}

/**
 * Modal de sélection de date avec calendrier visuel
 *
 * Fonctionnalités :
 * - Calendrier mensuel navigable
 * - Sélection rapide (aujourd'hui, demain, dans une semaine)
 * - Support des contraintes min/max
 * - Interface Material Design
 * - Navigation par mois et année
 */
export default function DatePickerModal({
  visible,
  selectedDate,
  onDateSelect,
  onDismiss,
  minimumDate,
  maximumDate,
  title = 'Sélectionner une date',
}: DatePickerModalProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

  // Navigation des mois
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Navigation des années
  const navigateYear = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setFullYear(newDate.getFullYear() - 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setCurrentDate(newDate);
  };

  // Obtenir les jours du mois
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Début de la semaine

    const days = [];
    for (let i = 0; i < 42; i++) { // 6 semaines * 7 jours
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Vérifier si une date est sélectable
  const isDateSelectable = (date: Date) => {
    if (minimumDate && date < minimumDate) return false;
    if (maximumDate && date > maximumDate) return false;
    return true;
  };

  // Vérifier si une date est sélectionnée
  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  };

  // Vérifier si une date est aujourd'hui
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  // Vérifier si une date est dans le mois courant
  const isCurrentMonth = (date: Date) => {
    return (
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  };

  // Gestionnaire de sélection de date
  const handleDateSelect = (date: Date) => {
    if (isDateSelectable(date)) {
      onDateSelect(date);
      onDismiss();
    }
  };

  // Sélections rapides
  const quickSelections = [
    {
      label: 'Aujourd\'hui',
      date: new Date(),
    },
    {
      label: 'Demain',
      date: (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      })(),
    },
    {
      label: 'Dans 1 semaine',
      date: (() => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return nextWeek;
      })(),
    },
    {
      label: 'Dans 1 mois',
      date: (() => {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      })(),
    },
  ];

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            {title}
          </Text>
          <IconButton
            icon="close"
            onPress={onDismiss}
            style={styles.closeButton}
          />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Sélections rapides */}
          <Card style={styles.quickCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Sélection rapide
              </Text>
              <View style={styles.quickSelections}>
                {quickSelections.map((item, index) => (
                  <Chip
                    key={index}
                    mode={isDateSelected(item.date) ? 'flat' : 'outlined'}
                    selected={isDateSelected(item.date)}
                    onPress={() => handleDateSelect(item.date)}
                    disabled={!isDateSelectable(item.date)}
                    style={styles.quickChip}
                  >
                    {item.label}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Navigation du calendrier */}
          <Card style={styles.calendarCard}>
            <Card.Content>
              <View style={styles.navigation}>
                <View style={styles.yearNavigation}>
                  <IconButton
                    icon="chevron-double-left"
                    onPress={() => navigateYear('prev')}
                    size={20}
                  />
                  <Text variant="titleMedium" style={styles.yearText}>
                    {currentDate.getFullYear()}
                  </Text>
                  <IconButton
                    icon="chevron-double-right"
                    onPress={() => navigateYear('next')}
                    size={20}
                  />
                </View>

                <View style={styles.monthNavigation}>
                  <IconButton
                    icon="chevron-left"
                    onPress={() => navigateMonth('prev')}
                    size={24}
                  />
                  <Text variant="titleLarge" style={styles.monthText}>
                    {months[currentDate.getMonth()]}
                  </Text>
                  <IconButton
                    icon="chevron-right"
                    onPress={() => navigateMonth('next')}
                    size={24}
                  />
                </View>
              </View>

              {/* Jours de la semaine */}
              <View style={styles.weekDaysRow}>
                {weekDays.map((day) => (
                  <Text key={day} variant="bodySmall" style={styles.weekDayText}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* Grille du calendrier */}
              <View style={styles.calendar}>
                {getDaysInMonth().map((date, index) => {
                  const isSelectable = isDateSelectable(date);
                  const isSelected = isDateSelected(date);
                  const isTodayDate = isToday(date);
                  const isInCurrentMonth = isCurrentMonth(date);

                  return (
                    <Button
                      key={index}
                      mode={isSelected ? 'contained' : 'text'}
                      onPress={() => handleDateSelect(date)}
                      disabled={!isSelectable}
                      style={[
                        styles.dayButton,
                        isSelected && styles.selectedDay,
                        isTodayDate && !isSelected && styles.todayDay,
                        !isInCurrentMonth && styles.otherMonthDay,
                      ]}
                      labelStyle={[
                        styles.dayText,
                        !isInCurrentMonth && styles.otherMonthText,
                        !isSelectable && styles.disabledDayText,
                        isTodayDate && !isSelected && styles.todayText,
                      ]}
                    >
                      {date.getDate()}
                    </Button>
                  );
                })}
              </View>
            </Card.Content>
          </Card>

          {/* Date sélectionnée */}
          {selectedDate && (
            <Card style={styles.selectedCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Date sélectionnée
                </Text>
                <Text variant="bodyLarge" style={styles.selectedDateText}>
                  {selectedDate.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </Card.Content>
            </Card>
          )}
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.actionButton}
          >
            Annuler
          </Button>
          <Button
            mode="contained"
            onPress={onDismiss}
            disabled={!selectedDate}
            style={styles.actionButton}
          >
            Confirmer
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    maxHeight: '90%',
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  closeButton: {
    margin: 0,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  quickCard: {
    marginBottom: 16,
    elevation: 1,
  },
  calendarCard: {
    marginBottom: 16,
    elevation: 1,
  },
  selectedCard: {
    marginBottom: 16,
    elevation: 1,
    backgroundColor: '#e3f2fd',
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#333',
    fontWeight: '600',
  },
  quickSelections: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    marginBottom: 4,
  },
  navigation: {
    marginBottom: 16,
  },
  yearNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  yearText: {
    marginHorizontal: 16,
    color: '#666',
    fontWeight: '500',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    marginHorizontal: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    minWidth: 120,
    textAlign: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  weekDayText: {
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    width: 36,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    width: '14.28%', // 100% / 7 jours
    aspectRatio: 1,
    margin: 0,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDay: {
    backgroundColor: '#1976d2',
  },
  todayDay: {
    borderWidth: 2,
    borderColor: '#1976d2',
  },
  todayText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  otherMonthText: {
    color: '#ccc',
  },
  disabledDayText: {
    color: '#ccc',
  },
  selectedDateText: {
    color: '#1976d2',
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});