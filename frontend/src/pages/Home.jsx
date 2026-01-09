import React, { useState, useEffect } from 'react'
import { Toaster } from '../components/ui/toaster'
import { useToast } from '../hooks/use-toast'
import { Button } from '../components/ui/button'
import RecordButton from '../components/app/RecordButton'
import ListeningWave from '../components/app/ListeningWave'
import IntentCard from '../components/app/IntentCard'
import ActionButtons from '../components/app/ActionButtons'
import FeedbackButtons from '../components/app/FeedbackButtons'
import DiagramLayout from '../components/app/DiagramLayout'
import ThemeToggle from '../components/ui/ThemeToggle'
import VisitorCounter from '../components/app/VisitorCounter'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { sendAudioToBackend, submitFeedback } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'


export default function Home() {
  // states: idle, recording, processing, result, feedback_submitted
  const [appState, setAppState] = useState('idle') 
  const [result, setResult] = useState(null)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackResult, setFeedbackResult] = useState(null)
  
  const { startRecording, stopRecording, isRecording, audioBlob, error: recorderError } = useAudioRecorder()
  const { toast } = useToast()

  // Steps for the Diagram: 0=Input, 1=Encoder, 2=Classifier, 3=Output
  const [diagramStep, setDiagramStep] = useState(0)

  useEffect(() => {
    switch (appState) {
        case 'idle': setDiagramStep(0); break;
        case 'recording': setDiagramStep(1); break; // Activating Encoder as we speak
        case 'processing': setDiagramStep(2); break; // Classifier
        case 'result': setDiagramStep(3); break; // Output
        case 'error': setDiagramStep(0); break;
    }
  }, [appState]);

  useEffect(() => {
    if (recorderError) {
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: recorderError
      })
      setAppState('idle')
    }
  }, [recorderError, toast])

  // Watch for blob update
  useEffect(() => {
    if (audioBlob && appState === 'recording') {
       handleAudioUpload(audioBlob)
    }
  }, [audioBlob])

  const handleStart = async () => {
    setAppState('recording')
    setResult(null)
    await startRecording()
  }

  const handleStop = () => {
    stopRecording()
    // appState remains 'recording' until blob is ready in effect
  }

  const handleAudioUpload = async (blob) => {
    setAppState('processing')
    try {
      const data = await sendAudioToBackend(blob)
      
      setResult(data)
      setAppState('result')
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Could not process your request. Please try again."
      })
      setAppState('error')
      setTimeout(() => setAppState('idle'), 3000)
    }
  }

  const handleAction = (action) => {
    toast({
      title: "Action Confirmed",
      description: `Proceeding with: ${action}`,
      className: "bg-neu-base border-white/50 text-neu-dark shadow-neu-flat"
    })
    
    // Reset to idle
    setTimeout(() => {
        setAppState('idle')
        setResult(null)
        setFeedbackResult(null)
    }, 2000)
  }

  const handleFeedbackSubmit = async ({ embeddingId, predictedIntent, isCorrect, correctIntent }) => {
    if (!embeddingId) {
      toast({
        variant: "destructive",
        title: "Feedback Error",
        description: "No embedding ID available. The system may be using transcription-only mode."
      })
      return
    }

    setFeedbackSubmitting(true)
    try {
      const response = await submitFeedback(embeddingId, predictedIntent, isCorrect, correctIntent)
      setFeedbackResult(response)
      
      toast({
        title: isCorrect ? "✓ Feedback Recorded" : "✓ Correction Learned",
        description: response.message,
        className: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
      })

      // If correction was made, show success state
      if (!isCorrect && correctIntent) {
        setAppState('feedback_submitted')
      }
    } catch (err) {
      console.error('Feedback error:', err)
      toast({
        variant: "destructive",
        title: "Feedback Failed",
        description: "Could not submit feedback. Please try again."
      })
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  const resetSession = () => {
    setAppState('idle')
    setResult(null)
    setFeedbackResult(null)
  }

  return (
    <div className="h-screen bg-neu-base dark:bg-neu-base-dark flex flex-col items-center py-4 px-6 lg:px-12 font-sans text-neu-dark dark:text-neu-text-dark transition-colors duration-500 overflow-hidden">
      
      {/* Header with Theme Toggle */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-between mb-4 flex-shrink-0 relative z-10"
      >
        <div className="absolute right-0 top-0 md:static">
          <ThemeToggle />
        </div>

        <div className="text-center w-full md:text-left md:w-auto mt-2 md:mt-0">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-700 dark:text-slate-100">
            VerbaOS
            </h1>
            <p className="text-neu-text dark:text-neu-text-dark mt-1 text-sm md:text-base italic font-medium">
            Powered by HuBERT + wav2vec2
            </p>
        </div>
      </motion.header>

      {/* System Diagram - Flexible Container */}
      <div className="w-full max-w-[1400px] flex-shrink-0 mb-4 scale-90 origin-top">
        <DiagramLayout activeStep={diagramStep} />
      </div>

      {/* Main Interaction Area */}
      <main className="w-full max-w-2xl flex flex-col items-center justify-center flex-grow">
        <AnimatePresence mode="wait">
          
          {/* IDLE State */}
          {appState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
               <RecordButton 
                  isRecording={false}
                  onClick={handleStart}
               />
            </motion.div>
          )}

          {/* RECORDING State */}
          {appState === 'recording' && (
             <motion.div
               key="recording"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="flex flex-col items-center justify-center h-full"
             >
                <div className="mb-8 scale-150">
                     <ListeningWave status="listening" />
                </div>
                <RecordButton 
                    isRecording={true}
                    onClick={handleStop}
                />
             </motion.div>
          )}

           {/* PROCESSING State */}
           {appState === 'processing' && (
             <motion.div
               key="processing"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="flex flex-col items-center justify-center h-full"
             >
                <div className="scale-150 mb-6">
                     <ListeningWave status="processing" />
                </div>
                <p className="mt-4 text-neu-text dark:text-neu-text-dark text-lg font-medium animate-pulse tracking-wide">
                    Analyzing Audio Signature...
                </p>
             </motion.div>
          )}

           {/* RESULT State */}
           {appState === 'result' && result && (
             <motion.div
               key="result"
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -30 }}
               className="w-full flex flex-col items-center justify-center h-full"
             >
                <div className="scale-90 md:scale-100 origin-center w-full">
                    <IntentCard 
                        intent={result.intent} 
                        confidence={result.confidence}
                        transcription={result.transcription}
                        topPredictions={result.top_predictions}
                    />
                    
                    {/* Feedback Section - YES/NO buttons */}
                    <FeedbackButtons
                      embeddingId={result.embedding_id}
                      predictedIntent={result.intent}
                      onFeedbackSubmit={handleFeedbackSubmit}
                      isSubmitting={feedbackSubmitting}
                    />
                    
                    {/* Original action buttons */}
                    <ActionButtons 
                        intent={result.intent} 
                        onAction={handleAction} 
                    />
                </div>
                 <div className="mt-8 text-center">
                    <button 
                        onClick={resetSession}
                        className="text-sm text-neu-text dark:text-neu-text-dark hover:text-primary dark:hover:text-blue-400 transition-colors hover:underline underline-offset-4"
                    >
                        Start New Session
                    </button>
                 </div>
             </motion.div>
          )}

          {/* FEEDBACK SUBMITTED State (after correction) */}
          {appState === 'feedback_submitted' && (
            <motion.div
              key="feedback_submitted"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <div className="w-20 h-20 mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-100 mb-2">
                Thanks for the correction!
              </h2>
              <p className="text-neu-text dark:text-neu-text-dark mb-6">
                The system will learn from this feedback.
              </p>
              {feedbackResult && (
                <p className="text-sm text-green-600 dark:text-green-400 mb-6">
                  {feedbackResult.message}
                </p>
              )}
              <Button
                onClick={resetSession}
                className="bg-neu-base dark:bg-neu-base-dark text-slate-700 dark:text-slate-200 shadow-neu-flat dark:shadow-neu-flat-dark hover:shadow-neu-pressed px-8 py-4 rounded-2xl font-semibold"
              >
                Start New Session
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Visitor Counter - Bottom Left */}
      <VisitorCounter />

      <Toaster />
    </div>
  )
}
