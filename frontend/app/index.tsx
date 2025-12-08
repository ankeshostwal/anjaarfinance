import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import ContractsListScreen from './screens/ContractsListScreen';
import ContractDetailScreen from './screens/ContractDetailScreen';
import { AuthProvider } from './context/AuthContext';

const Stack = createNativeStackNavigator();

export default function Index() {
  return (
    <AuthProvider>
      <NavigationContainer independent={true}>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ContractsList" 
            component={ContractsListScreen}
            options={{ 
              title: 'Vehicle Finance Contracts',
              headerBackVisible: false
            }}
          />
          <Stack.Screen 
            name="ContractDetail" 
            component={ContractDetailScreen}
            options={{ title: 'Contract Details' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
