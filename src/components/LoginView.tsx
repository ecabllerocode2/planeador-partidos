import React, { useState } from 'react';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail, // Para que el usuario elija su propia contraseña
   type User 
} from 'firebase/auth';
import { doc, getFirestore, getDoc } from 'firebase/firestore'; 
import { IoFootball } from "react-icons/io5"; 

interface LoginProps {
  // Función para manejar el éxito del login y pasar el objeto User a App.tsx
  onLogin: (user: User) => void;
  // Función para mostrar mensajes de error en la UI
  onError: (msg: string | null) => void;
  // Mensaje de error actual (viene de App.tsx)
  error: string | null;
}

const LoginView: React.FC<LoginProps> = ({ onLogin, onError, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Inicialización de Auth y Firestore
  const auth = getAuth();
  const db = getFirestore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    onError(null); // Limpiar errores anteriores

    try {
      // 1. Autenticación: Verifica email y contraseña
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Autorización: Verifica Lista Blanca (Whitelist) en Firestore
      // Usamos el UID único del usuario como clave
      const docRef = doc(db, 'authorized_users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data()?.authorized === true) {
        // ✅ Usuario autenticado Y autorizado
        onLogin(user); 
      } else {
        // ❌ Usuario autenticado, pero NO autorizado
        onError("Acceso denegado. Tu cuenta no está en la lista de árbitros autorizados.");
        // Cerrar sesión inmediatamente para evitar accesos futuros
        await auth.signOut(); 
      }
    } catch (firebaseError: any) {
      // Manejo de errores específicos de Firebase
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
        onError("Correo o contraseña incorrectos.");
      } else {
        onError(`Error al iniciar sesión: ${firebaseError.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      alert("Por favor, introduce tu correo electrónico en el campo para restablecer la contraseña.");
      return;
    }
    
    setIsLoading(true);
    onError(null);
    
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Se ha enviado un correo electrónico a tu dirección. Revisa tu bandeja de entrada para establecer una nueva contraseña.");
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        onError("El correo no está registrado. Contacta al administrador para ser agregado.");
      } else {
        onError(`Error al enviar el correo: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-2xl">
        
        <div className="text-center mb-6">
            <IoFootball className="w-12 h-12 mx-auto text-emerald-600 mb-2" />
            <h2 className="text-2xl font-bold text-gray-800">Acceso Árbitros Prodefut</h2>
        </div>
        
        {/* Mostrar Error de Login/Auth */}
        {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4 font-medium text-sm">
                🚨 {error}
            </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo Electrónico"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition duration-200 disabled:bg-gray-400"
          >
            {isLoading ? 'Verificando acceso...' : 'Iniciar Sesión'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            type="button" 
            onClick={handlePasswordReset}
            disabled={isLoading}
            className="text-sm text-gray-500 hover:text-emerald-600 transition duration-200"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;