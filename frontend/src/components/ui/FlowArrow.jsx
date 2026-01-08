import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const FlowArrow = ({ label, delay = 0 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, width: 0 }}
      animate={{ opacity: 1, width: "auto" }}
      transition={{ duration: 0.8, delay, ease: "easeInOut" }}
      className="flex flex-col items-center justify-center px-4 text-neu-text dark:text-neu-text-dark shrink-0"
    >
      <span className="text-xs font-bold mb-1 tracking-widest uppercase opacity-60 scale-75 lg:scale-100 hidden md:block">{label}</span>
      <div className="relative flex items-center">
        <div className="h-[2px] md:h-[3px] w-4 md:w-16 lg:w-20 bg-neu-text/20 dark:bg-neu-text-dark/20 rounded-full" />
        <ArrowRight className="w-4 h-4 md:w-6 md:h-6 ml-[-4px] md:ml-[-8px] text-neu-text/30 dark:text-neu-text-dark/30" />
      </div>
    </motion.div>
  );
};

export default FlowArrow;
