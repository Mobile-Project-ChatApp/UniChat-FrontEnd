import { StyleSheet } from 'react-native';

export const lightTheme = {
  background: '#FFFFFF',
  text: '#000000',
  secondaryText: '#666666',
  card: '#F8F8F8',
  border: '#E0E0E0',
  input: '#F5F5F5',
  primary: '#4A90E2',
  accent: '#FF3B30',
  chat: {
    outgoing: '#DCF8C6',
    incoming: '#F2F2F7',
  }
};

export const darkTheme = {
  background: '#121212',
  text: '#FFFFFF',
  secondaryText: '#AAAAAA',
  card: '#1E1E1E',
  border: '#333333',
  input: '#2A2A2A',
  primary: '#82B1FF',
  accent: '#FF453A',
  chat: {
    outgoing: '#004D40',
    incoming: '#303030',
  }
};

export const createThemedStyles = (isDarkMode: boolean) => {
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    text: {
      color: theme.text,
    },
    secondaryText: {
      color: theme.secondaryText,
    },
    card: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: 16,
      marginVertical: 8,
    },
    input: {
      backgroundColor: theme.input,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      color: theme.text,
    },
    button: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });
};