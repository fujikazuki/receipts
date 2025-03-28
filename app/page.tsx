'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import Modal from '@/components/Modal'

export default function Home() {
  const [image, setImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [analysisResult, setAnalysisResult] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1
  })

  const handleSubmit = async () => {
    if (!image) return

    setIsLoading(true)
    try {
      // Check image size
      const imageSize = image.length * 3/4; // Base64 is ~33% larger than binary
      if (imageSize > 20 * 1024 * 1024) { // 20MB limit
        throw new Error('Image size too large. Please use an image under 20MB.');
      }

      // Use the local API endpoint in development
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? '/api/analyze-receipt'
        : 'https://us-central1-receipts-87efd.cloudfunctions.net/analyzeReceipt';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image }),
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json()
      setAnalysisResult(data.text)
      setModalOpen(true)
    } catch (error: any) {
      console.error('Error analyzing receipt:', error)
      alert(error?.message || 'Failed to analyze receipt')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div {...getRootProps()} className="mb-8">
          <input {...getInputProps()} />
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition-colors">
            {image ? (
              <div className="relative w-full h-64">
                <Image
                  src={image}
                  alt="Uploaded receipt"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <p className="text-gray-500">
                {isDragActive
                  ? "Drop the receipt here"
                  : "Drag 'n' drop a receipt, or click to select"}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!image || isLoading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Receipt'}
        </button>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        content={analysisResult}
      />
    </main>
  )
}