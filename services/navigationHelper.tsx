import { router } from 'expo-router';

export const navigateToLogin = () => {
  try {
    // Use Expo Router navigation
    router.replace('/auth/login');
  } catch (error) {
    console.log('Navigation error:', error);
    
    try {
      // Fallback
      router.navigate('/auth/login');
    } catch (innerError) {
      console.log('Fallback navigation failed:', innerError);
    }
  }
};

export const navigateToWelcome = () => {
  try {
    router.replace('/WelcomeScreen');
  } catch (error) {
    console.log('Navigation error:', error);
  }
};