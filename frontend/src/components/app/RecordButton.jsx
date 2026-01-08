import { motion } from 'framer-motion';
import { Mic, Square } from 'lucide-react';

const RecordButton = ({ isRecording, onClick }) => {
  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
        className={`
          w-32 h-32 rounded-full flex items-center justify-center
          transition-all duration-300 ease-in-out
          text-neu-dark dark:text-neu-text-dark
          bg-neu-base dark:bg-neu-base-dark
          border-4 border-transparent
          ${isRecording 
            ? 'shadow-neu-pressed dark:shadow-neu-pressed-dark text-rose-500 dark:text-rose-400 border-rose-100 dark:border-rose-900/30' 
            : 'shadow-neu-flat dark:shadow-neu-flat-dark hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-50 dark:hover:border-blue-900/30'}
        `}
      >
        {isRecording ? (
          <Square className="w-10 h-10 fill-current" />
        ) : (
          <Mic className="w-10 h-10" />
        )}
      </motion.button>
      <span className={`text-base font-semibold tracking-wide uppercase transition-colors ${isRecording ? 'text-rose-500/90 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
        {isRecording ? 'Listening...' : 'Click Here to Speak'}
      </span>
    </div>
  );
};

export default RecordButton;