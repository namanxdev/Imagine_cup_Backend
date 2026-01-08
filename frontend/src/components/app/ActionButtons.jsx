import NeumorphicCard from '../ui/NeumorphicCard';
import { Button } from '../ui/button';

const ActionButtons = ({ intent, onAction }) => {
  // If intent is not one of the known ones, show default actions or generic ones
  // Mapping intent to possible follow-up actions
  const actionsMap = {
    water: ["Log Hydration", "Notify Nurse"],
    food: ["View Menu", "Request Snack"],
    medicine: ["Log Medication", "Call Pharmacy"],
    help: ["Call Nurse", "Emergency Contact"],
    emergency: ["CALL 911", "Alert All Staff", "False Alarm"],
    unknown: ["Retry", "Manual Entry"]
  };

  const currentActions = actionsMap[intent?.toLowerCase()] || actionsMap.unknown;

  if (!intent) return null;

  return (
    <div className="flex flex-wrap gap-4 justify-center mt-8">
      {currentActions.map((action, idx) => (
        <Button
          key={idx}
          onClick={() => onAction && onAction(action)}
          aria-label={`Select action: ${action}`}
          className="bg-neu-base dark:bg-neu-base-dark text-slate-700 dark:text-slate-200 shadow-neu-flat dark:shadow-neu-flat-dark hover:shadow-neu-pressed dark:hover:shadow-neu-pressed-dark hover:translate-y-[1px] hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-white/60 dark:border-white/10 rounded-2xl px-10 py-8 h-auto text-lg font-semibold tracking-wide"
        >
          {action}
        </Button>
      ))}
    </div>
  );
};

export default ActionButtons;