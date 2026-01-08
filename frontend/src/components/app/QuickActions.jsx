import React from 'react'
import { motion } from 'framer-motion'
import { Utensils, Droplets, AlertTriangle, HeartPulse, Bath } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

export default function QuickActions({ onQuickAction }) {
  const actions = [
    { 
      label: "Water", 
      icon: Droplets, 
      intent: "request_water", 
      message: "Requesting water.",
      color: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
    },
    { 
      label: "Food", 
      icon: Utensils, 
      intent: "request_food", 
      message: "Requesting food.",
      color: "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200"
    },
    { 
      label: "Restroom", 
      icon: Bath, 
      intent: "request_restroom", 
      message: "Requesting restroom assistance.",
      color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200"
    },
    { 
      label: "Pain", 
      icon: HeartPulse, 
      intent: "report_pain", 
      message: "Alerting for pain relief.",
      color: "bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200"
    },
    { 
      label: "Emergency", 
      icon: AlertTriangle, 
      intent: "emergency_alert", 
      message: "EMERGENCY ALERT TRIGGERED.",
      color: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200 col-span-2 font-bold"
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-8">
      {actions.map((action, index) => (
        <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(action.intent === 'emergency_alert' && "col-span-2")}
        >
          <Button
            variant="outline"
            className={cn(
                "w-full h-16 flex items-center justify-start space-x-4 px-4 border shadow-sm transition-all hover:scale-[1.02]",
                action.color
            )}
            onClick={() => onQuickAction(action)}
          >
            <action.icon className="w-6 h-6" />
            <span className="text-lg">{action.label}</span>
          </Button>
        </motion.div>
      ))}
    </div>
  )
}