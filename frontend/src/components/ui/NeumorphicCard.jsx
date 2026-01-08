import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

const NeumorphicCard = ({ children, className, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={cn(
        "bg-neu-base dark:bg-neu-base-dark rounded-[24px] shadow-neu-flat dark:shadow-neu-flat-dark p-8 border border-white/40 dark:border-white/5",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export default NeumorphicCard;
