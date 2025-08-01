import { RootSiblingParent } from 'react-native-root-siblings'
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './app/navigation/RootNavigator';



export default function App() {
  return (
      <RootSiblingParent>
        <StatusBar style="light" />
        <RootNavigator />
      </RootSiblingParent>
  );
}
