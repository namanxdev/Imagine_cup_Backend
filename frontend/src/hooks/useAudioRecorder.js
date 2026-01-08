import { useState, useRef, useCallback, useEffect } from 'react'

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [error, setError] = useState(null)
  const [audioStream, setAudioStream] = useState(null)

  const audioContextRef = useRef(null)
  const processorRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  // Ref to track recording state inside event handlers
  const isRecordingRef = useRef(false)

  const startRecording = useCallback(async () => {
    setError(null)
    setAudioBlob(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          channelCount: 1,
          sampleRate: 16000 
        } 
      })
      streamRef.current = stream
      setAudioStream(stream)

      const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 })
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      // Buffer size 4096, 1 input channel, 1 output channel
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        if (!isRecordingRef.current) return
        const input = e.inputBuffer.getChannelData(0)
        // Clone the data
        chunksRef.current.push(new Float32Array(input))
      }

      source.connect(processor)
      processor.connect(audioContext.destination)

      isRecordingRef.current = true
      setIsRecording(true)

      // Auto-stop after 3 seconds
      timerRef.current = setTimeout(() => {
        if (isRecordingRef.current) {
          stopRecording()
        }
      }, 3000)

    } catch (err) {
      console.error("Error accessing microphone:", err)
      setError("Could not access microphone. Please check permissions.")
      setIsRecording(false)
      isRecordingRef.current = false
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return

    isRecordingRef.current = false
    setIsRecording(false)

    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (processorRef.current && audioContextRef.current) {
        processorRef.current.disconnect()
        audioContextRef.current.close()
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    setAudioStream(null)

    // Process gathered chunks into WAV
    const wavBlob = encodeWAV(chunksRef.current, 16000)
    setAudioBlob(wavBlob)

  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (isRecordingRef.current) {
         if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
         if (audioContextRef.current) audioContextRef.current.close()
      }
    }
  }, [])

  return {
    isRecording,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    audioStream
  }
}

// Helper to encode WAV
function encodeWAV(samples, sampleRate) {
  // Flatten Float32Arrays
  const bufferLength = samples.reduce((acc, chunk) => acc + chunk.length, 0)
  const buffer = new Float32Array(bufferLength)
  let offset = 0
  for (const chunk of samples) {
    buffer.set(chunk, offset)
    offset += chunk.length
  }

  // Create WAV file
  const bufferSize = buffer.length * 2 // 16-bit
  const view = new DataView(new ArrayBuffer(44 + bufferSize))

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + bufferSize, true)
  writeString(view, 8, 'WAVE')

  // fmt sub-chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true) // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true) // NumChannels (1 for Mono)
  view.setUint32(24, sampleRate, true) // SampleRate
  view.setUint32(28, sampleRate * 2, true) // ByteRate (SampleRate * BlockAlign)
  view.setUint16(32, 2, true) // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true) // BitsPerSample

  // data sub-chunk
  writeString(view, 36, 'data')
  view.setUint32(40, bufferSize, true)

  // Write PCM samples
  floatTo16BitPCM(view, 44, buffer)

  return new Blob([view], { type: 'audio/wav' })
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]))
    // Convert float to 16-bit PCM
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
  }
}
