import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const AudioVisualizer = ({ isRecording, audioStream }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Draw flat line when not recording
    const drawFlatLine = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Get computed styles for theming
      const isDark = document.documentElement.classList.contains('dark');
      
      // Draw subtle gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, isDark ? 'rgba(100, 116, 139, 0.1)' : 'rgba(148, 163, 184, 0.1)');
      gradient.addColorStop(0.5, isDark ? 'rgba(100, 116, 139, 0.2)' : 'rgba(148, 163, 184, 0.2)');
      gradient.addColorStop(1, isDark ? 'rgba(100, 116, 139, 0.1)' : 'rgba(148, 163, 184, 0.1)');
      
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw center dot
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.5)';
      ctx.fill();
    };

    // Draw waveform when recording
    const drawWaveform = () => {
      if (!analyserRef.current || !dataArrayRef.current) {
        drawFlatLine();
        return;
      }

      animationRef.current = requestAnimationFrame(drawWaveform);
      
      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      
      analyser.getByteTimeDomainData(dataArray);
      
      ctx.clearRect(0, 0, width, height);
      
      const isDark = document.documentElement.classList.contains('dark');
      
      // Draw waveform
      ctx.beginPath();
      ctx.lineWidth = 3;
      
      // Create gradient for the line - neutral slate colors
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, isDark ? '#94a3b8' : '#64748b');
      gradient.addColorStop(0.5, isDark ? '#cbd5e1' : '#475569');
      gradient.addColorStop(1, isDark ? '#94a3b8' : '#64748b');
      ctx.strokeStyle = gradient;
      
      const sliceWidth = width / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
      
      // Add subtle glow effect
      ctx.shadowColor = isDark ? '#94a3b8' : '#64748b';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    if (isRecording && audioStream) {
      // Set up audio analyser
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(audioStream);
      
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      
      drawWaveform();
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        audioContext.close();
      };
    } else {
      // Draw flat line when idle
      drawFlatLine();
      
      // Redraw on theme change
      const observer = new MutationObserver(() => {
        drawFlatLine();
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      
      return () => {
        observer.disconnect();
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isRecording, audioStream]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto mb-6"
    >
      <div className="relative px-4 py-6 rounded-2xl bg-neu-base dark:bg-neu-base-dark shadow-neu-flat dark:shadow-neu-flat-dark">
        {/* Label */}
        <div className="absolute top-2 left-4 text-[10px] uppercase tracking-widest font-medium text-neu-text/60 dark:text-neu-text-dark/60">
          {isRecording ? 'Recording...' : 'Audio Signal'}
        </div>
        
        {/* Recording indicator */}
        {isRecording && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-4 flex items-center gap-2"
          >
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-slate-500 dark:bg-slate-400"
            />
            <span className="text-[10px] uppercase tracking-wider font-medium text-slate-500 dark:text-slate-400">
              Live
            </span>
          </motion.div>
        )}
        
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={600}
          height={100}
          className="w-full h-24 rounded-lg"
        />
      </div>
    </motion.div>
  );
};

export default AudioVisualizer;
