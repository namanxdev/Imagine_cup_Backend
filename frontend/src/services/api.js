import axios from 'axios'

// Use environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000' 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const sendAudioToBackend = async (audioBlob) => {
  if (!audioBlob) throw new Error("No audio blob provided")

  const formData = new FormData()
  // Append with a filename so backend treats it as a file. 
  // Using .wav as required by the backend.
  formData.append('audio', audioBlob, 'recording.wav')

  try {
    const response = await apiClient.post('/api/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    console.error("API Error sending audio:", error)
    throw error
  }
}