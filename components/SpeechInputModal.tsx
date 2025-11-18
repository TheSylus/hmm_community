import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/index';
import { MicrophoneIcon } from './Icons';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechInputModalProps {
  onDictate: (transcript: string) => void;
  onClose: () => void;
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechSupported = !!SpeechRecognition;

export const SpeechInputModal: React.FC<SpeechInputModalProps> = ({ onDictate, onClose }) => {
  const { t, language } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    if (!isSpeechSupported) {
      alert("Speech recognition is not supported in this browser.");
      onClose();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onend = () => {
        setIsListening(false);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        onDictate(transcriptRef.current);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      onClose();
    };

    recognition.onresult = (event: any) => {
      const currentTranscript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      transcriptRef.current = currentTranscript;
      setTranscript(currentTranscript);
    };

    recognition.start();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, onDictate, onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-lg text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('speechModal.title')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{t('speechModal.description')}</p>
        
        <div className="my-8 flex justify-center items-center">
            <div className={`relative w-24 h-24 flex items-center justify-center rounded-full transition-colors ${isListening ? 'bg-red-500' : 'bg-gray-400'}`}>
                 {isListening && <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>}
                <MicrophoneIcon className="w-12 h-12 text-white" />
            </div>
        </div>
        
        <div className="min-h-[60px] p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
            <p className="text-lg text-gray-800 dark:text-gray-200 font-medium">
                {transcript || (isListening ? t('speechModal.listening') : '...')}
            </p>
        </div>

      </div>
       <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};