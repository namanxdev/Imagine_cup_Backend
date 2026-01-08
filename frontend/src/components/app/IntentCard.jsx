import { motion } from 'framer-motion';
import NeumorphicCard from '../ui/NeumorphicCard';

const IntentCard = ({ intent, confidence, transcription, topPredictions }) => {
  // Get alternative predictions (2nd and 3rd)
  const alternatives = topPredictions?.slice(1, 3) || [];

  return (
    <NeumorphicCard className="w-full max-w-md mx-auto text-center">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-neu-text dark:text-neu-text-dark text-xs uppercase tracking-widest mb-3 font-medium">Detected Intent</div>
        <div className="text-3xl md:text-4xl font-bold text-slate-600 dark:text-slate-200 mb-4 capitalize">
          {intent || "Unknown"}
        </div>
        {transcription && (
          <div className="text-sm text-neu-text/70 dark:text-neu-text-dark/70 italic mb-5 max-w-[85%] mx-auto">
             "{transcription}"
          </div>
        )}
        
        {confidence && (
           <div className="inline-block px-5 py-2 rounded-full bg-neu-base dark:bg-neu-base-dark shadow-neu-pressed dark:shadow-neu-pressed-dark text-xs font-medium font-mono text-neu-text dark:text-neu-text-dark">
             {(confidence * 100).toFixed(0)}% confidence
           </div>
        )}

        {/* Alternative Predictions */}
        {alternatives.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 pt-5 border-t border-slate-200/50 dark:border-slate-700/50"
          >
            <div className="text-neu-text/60 dark:text-neu-text-dark/60 text-[10px] uppercase tracking-widest mb-3 font-medium">
              Also possible
            </div>
            <div className="flex justify-center gap-3">
              {alternatives.map((pred, idx) => (
                <motion.div
                  key={pred.intent}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="px-4 py-2 rounded-xl bg-neu-base dark:bg-neu-base-dark shadow-neu-btn-sm dark:shadow-neu-btn-dark"
                >
                  <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 capitalize">
                    {pred.intent}
                  </div>
                  <div className="text-[10px] font-mono text-neu-text/60 dark:text-neu-text-dark/60">
                    {(pred.confidence * 100).toFixed(0)}%
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </NeumorphicCard>
  );
};

export default IntentCard;
