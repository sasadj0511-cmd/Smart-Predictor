import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Globe } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl"
      >
        <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Zap className="w-10 h-10 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Smart Predictor</h1>
        <p className="text-slate-400 mb-8">Prijavite se da biste pristupili AI analizi fudbalskih mečeva u realnom vremenu.</p>
        <button 
          onClick={onLogin}
          className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20"
        >
          <Globe className="w-5 h-5" />
          Prijava putem Google-a
        </button>
      </motion.div>
    </div>
  );
};
