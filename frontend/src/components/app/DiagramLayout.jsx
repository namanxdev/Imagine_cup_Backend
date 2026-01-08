import { motion } from 'framer-motion';
import NeumorphicCard from '../ui/NeumorphicCard';
import FlowArrow from '../ui/FlowArrow';
import { Mic, Cpu, Brain, MessageSquare } from 'lucide-react';

const DiagramNode = ({ icon: Icon, title, items, delay, isActive }) => {
  return (
    <NeumorphicCard 
      delay={delay} 
      className={`min-w-[130px] md:min-w-[160px] flex flex-col items-center justify-center p-4 md:p-6 transition-all duration-500 border-2 shrink-0
        ${isActive 
            ? 'bg-white/60 dark:bg-white/5 border-blue-300 dark:border-blue-700 shadow-neu-pressed dark:shadow-neu-pressed-dark transform scale-105' 
            : 'border-transparent opacity-80 scale-95'}`}
    >
      <div className={`p-4 rounded-full mb-4 transition-colors duration-500
        ${isActive 
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 shadow-inner' 
            : 'bg-neu-base dark:bg-neu-base-dark shadow-neu-flat dark:shadow-neu-flat-dark text-neu-text dark:text-neu-text-dark'}`}>
        <Icon className="w-6 h-6 md:w-8 md:h-8" />
      </div>
      <h3 className={`text-sm md:text-base font-bold mb-3 transition-colors ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{title}</h3>
      {items && (
        <div className="flex flex-col gap-2 w-full">
            {items.map((item, i) => (
                <div key={i} className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300 bg-neu-base/40 dark:bg-black/20 p-2 rounded-lg text-center border border-white/50 dark:border-white/5 truncate">
                    {item}
                </div>
            ))}
        </div>
      )}
    </NeumorphicCard>
  );
};

const DiagramLayout = ({ activeStep }) => {
  // activeStep: 0=Input, 1=Encoder, 2=Classifier, 3=Output
  
  return (
    <div className="flex items-center justify-center md:justify-center gap-1 md:gap-3 w-full max-w-7xl mx-auto py-2 overflow-x-auto px-2 no-scrollbar">
        
      <DiagramNode 
        icon={Mic} 
        title="Input" 
        items={["Audio"]} 
        delay={0.1}
        isActive={activeStep >= 0}
      />
      
      <FlowArrow label="Raw" delay={0.2} />
      
      <DiagramNode 
        icon={Cpu} 
        title="Encoder" 
        items={["HuBERT", "wav2vec2"]} 
        delay={0.3}
        isActive={activeStep >= 1}
      />
      
      <FlowArrow label="Feat." delay={0.4} />
      
      <DiagramNode 
        icon={Brain} 
        title="Classifier" 
        items={["Intent Logic"]} 
        delay={0.5}
        isActive={activeStep >= 2}
      />
      
      <FlowArrow label="Intent" delay={0.6} />
      
      <DiagramNode 
        icon={MessageSquare} 
        title="Output" 
        items={["Action"]} 
        delay={0.7}
        isActive={activeStep >= 3}
      />
      
    </div>
  );
};

export default DiagramLayout;
