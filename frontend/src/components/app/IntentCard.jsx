import { motion } from 'framer-motion';
import NeumorphicCard from '../ui/NeumorphicCard';

const IntentCard = ({ intent, confidence, transcription }) => {
  return (
    <NeumorphicCard className="w-full max-w-lg mx-auto text-center border-l-8 border-l-blue-400/50 dark:border-l-blue-500/50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-neu-text dark:text-neu-text-dark text-base uppercase tracking-widest mb-3 font-semibold">My Analysis Is</div>
        <div className="text-4xl md:text-5xl font-black text-slate-700 dark:text-slate-100 mb-4 capitalize tracking-tight">
          "{intent || "Unknown"}"
        </div>
        {transcription && (
          <div className="text-lg text-neu-text/80 dark:text-neu-text-dark/80 italic mb-6 max-w-[90%] mx-auto font-serif">
             &ldquo;{transcription}&rdquo;
          </div>
        )}
        
        {confidence && (
           <div className="inline-block px-6 py-2 rounded-full bg-neu-base dark:bg-neu-base-dark shadow-neu-pressed dark:shadow-neu-pressed-dark text-sm font-bold font-mono text-neu-text dark:text-neu-text-dark border-b border-white/50 dark:border-white/5">
             Confidence: {(confidence * 100).toFixed(1)}%
           </div>
        )}
      </motion.div>
    </NeumorphicCard>
  );
};

export default IntentCard;
