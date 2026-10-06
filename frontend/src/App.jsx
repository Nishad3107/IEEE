import Login from './components/Login';

export default function App() {
  return <Login onLogin={(user) => console.log('Authenticated user:', user)} />;
}
