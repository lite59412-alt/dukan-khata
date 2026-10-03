import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Language } from '../types';
import {
  parseVoiceUdhariCommand,
  ParsedVoiceUdhari,
  ExistingCustomerRef,
} from '../utils/voiceUdhariParser';

// Browser SpeechRecognition typing
interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
      length: number;
    };
    length: number;
  };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
}

interface VoiceUdhariModalProps {
  language: Language;
  existingCustomers: ExistingCustomerRef[];
  popularItemNames?: string[];
  onVoiceCommandRecognized: (parsed: ParsedVoiceUdhari) => void;
  onClose: () => void;
}

const SAMPLE_VOICE_COMMANDS = [
  'Ramesh ko 2 kilo chawal 120 rupaye ka udhar',
  'Suresh ko 5 packet biscuit 50 rupaye',
  'Mahesh 1 litre tel 140 rupaye',
  'Rahul ko 500 rupaye ka atta',
  'Amit 300 rupaye ka udhar',
];

export const VoiceUdhariModal: React.FC<VoiceUdhariModalProps> = ({
  language,
  existingCustomers,
  popularItemNames = [],
  onVoiceCommandRecognized,
  onClose,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [selectedLang, setSelectedLang] = useState<'hi-IN' | 'en-IN'>('hi-IN');

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and start speech recognition
  const startRecording = async () => {
    setErrorMessage(null);
    setTranscript('');
    setInterimText('');

    // Check browser speech recognition API support
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;

    // Check mic permission first via getUserMedia if available
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Close tracks immediately after permission check
        stream.getTracks().forEach((track) => track.stop());
        setHasMicPermission(true);
      } catch (err: unknown) {
        const errObj = err as { name?: string };
        if (errObj.name === 'NotAllowedError' || errObj.name === 'PermissionDeniedError') {
          setHasMicPermission(false);
          setErrorMessage(
            language === 'hi'
              ? 'माइक्रोफ़ोन अनुमति अस्वीकृत है। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें या नीचे लिखें।'
              : 'Microphone permission was denied. Please allow microphone access or type below.'
          );
          return;
        }
      }
    }

    if (!SpeechRec) {
      setErrorMessage(
        language === 'hi'
          ? 'इस ब्राउज़र में वॉइस रिकॉग्निशन समर्थित नहीं है। आप नीचे बोलकर या लिखकर टेस्ट कर सकते हैं।'
          : 'Speech recognition is not supported in this browser. You can type or use the sample commands below.'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = selectedLang;

      rec.onstart = () => {
        setIsListening(true);
        setHasMicPermission(true);
      };

      rec.onresult = (event: SpeechRecognitionEventLike) => {
        let finalStr = '';
        let interimStr = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalStr += res[0].transcript + ' ';
          } else {
            interimStr += res[0].transcript;
          }
        }

        if (finalStr.trim()) {
          setTranscript(finalStr.trim());
          setInterimText('');
        } else {
          setInterimText(interimStr);
        }
      };

      rec.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        if (e.error === 'not-allowed') {
          setHasMicPermission(false);
          setErrorMessage(
            language === 'hi'
              ? 'माइक्रोफ़ोन अनुमति नहीं मिली। कृपया ब्राउज़र में अनुमति दें।'
              : 'Microphone permission not granted. Please allow microphone access.'
          );
        } else if (e.error === 'no-speech') {
          // No speech detected
        } else {
          setErrorMessage(
            language === 'hi'
              ? 'वॉइस इनपुट नहीं सुना जा सका। कृपया दोबारा बोलें।'
              : 'Could not catch voice input. Please try again.'
          );
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();

      // Auto stop after 8 seconds of silence to prevent hanging
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (rec) {
          try {
            rec.stop();
          } catch {
            // ignore
          }
        }
      }, 9000);
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setIsListening(false);
      setErrorMessage(
        language === 'hi'
          ? 'माइक्रोफ़ोन शुरू करने में समस्या आई। कृपया नीचे सैंपल चुनें या लिखें।'
          : 'Failed to access microphone. Please select a sample command or type below.'
      );
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // Start listening on mount
  useEffect(() => {
    startRecording();
    return () => {
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLang]);

  // Process a chosen or spoken transcript
  const handleProcessCommand = (textToProcess: string) => {
    const clean = textToProcess.trim();
    if (!clean) return;

    stopRecording();
    const parsed = parseVoiceUdhariCommand(clean, existingCustomers, popularItemNames);
    onVoiceCommandRecognized(parsed);
  };

  const currentDisplayText = transcript || interimText;

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-rose-500/40 p-5 sm:p-6 shadow-2xl space-y-4 my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shadow-inner">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>{language === 'hi' ? 'आवाज़ से उधारी जोड़ें' : 'Voice Add Udhari'}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  AI Voice
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'hi'
                  ? 'ग्राहक का नाम, सामान और रकम बोलें'
                  : 'Speak customer name, item and amount'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopRecording();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language selector toggle */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold text-slate-400">
            {language === 'hi' ? 'बोलने की भाषा:' : 'Recognition Language:'}
          </span>
          <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedLang('hi-IN')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                selectedLang === 'hi-IN'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              हिन्दी / Hinglish
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang('en-IN')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                selectedLang === 'en-IN'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Central Pulsing Mic & Visualizer */}
        <div className="py-4 flex flex-col items-center justify-center text-center space-y-3">
          <div className="relative">
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping opacity-75" />
                <div className="absolute -inset-3 rounded-full bg-rose-500/10 animate-pulse" />
              </>
            )}

            <button
              type="button"
              onClick={isListening ? stopRecording : startRecording}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-95 ${
                isListening
                  ? 'bg-gradient-to-tr from-rose-600 to-rose-500 text-white shadow-rose-950/60 ring-4 ring-rose-500/30'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
              }`}
            >
              {isListening ? (
                <Mic className="w-9 h-9 animate-pulse" />
              ) : (
                <MicOff className="w-8 h-8 text-slate-400" />
              )}
            </button>
          </div>

          <div>
            <p className="text-xs font-bold text-white">
              {isListening
                ? language === 'hi'
                  ? '🎙️ सुन रहे हैं... अभी बोलिए'
                  : '🎙️ Listening... Speak now'
                : language === 'hi'
                ? 'माइक बंद है (टैप करके बोलें)'
                : 'Microphone idle (Tap to speak)'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === 'hi'
                ? 'जैसे: "रमेश को 2 किलो चावल 120 रुपये का उधार"'
                : 'e.g. "Ramesh ko 2 kilo chawal 120 rupaye ka udhar"'}
            </p>
          </div>
        </div>

        {/* Live Audio Visualizer / Recognized Text Display Box */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 min-h-[76px] flex flex-col justify-center">
          {currentDisplayText ? (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <Volume2 className="w-3 h-3" />
                <span>{language === 'hi' ? 'पहचाना गया वाक्य:' : 'Recognized Voice:'}</span>
              </span>
              <p className="text-xs font-semibold text-white leading-relaxed">
                "{currentDisplayText}"
              </p>
            </div>
          ) : (
            <div className="text-center py-1 text-slate-500 text-xs italic">
              {isListening
                ? language === 'hi'
                  ? 'माइक में बोलें, शब्द यहाँ दिखाई देंगे...'
                  : 'Speak into microphone, text will appear here...'
                : language === 'hi'
                ? 'माइक बटन दबाकर बोलें या नीचे से सैंपल चुनें'
                : 'Tap the mic button or pick a sample below'}
            </div>
          )}
        </div>

        {/* Action button if speech recognized */}
        {currentDisplayText && (
          <button
            type="button"
            onClick={() => handleProcessCommand(currentDisplayText)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-black shadow-lg shadow-rose-950/40 transition-all active:scale-95"
          >
            <span>{language === 'hi' ? 'उधारी फॉर्म में भरें' : 'Fill into Udhari Form'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {/* Error notification if mic blocked or unavailable */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <p className="text-[11px] leading-snug">{errorMessage}</p>
              <button
                type="button"
                onClick={startRecording}
                className="text-[10px] font-bold text-amber-400 underline hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'hi' ? 'दोबारा कोशिश करें' : 'Try Again'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Sample Voice Commands (Always available to test instantly) */}
        <div className="pt-2 border-t border-slate-800 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{language === 'hi' ? 'त्वरित टेस्ट सैंपल (1-टैप करें):' : 'Quick Test Commands (1-Tap):'}</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_VOICE_COMMANDS.map((cmd, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleProcessCommand(cmd)}
                className="text-[11px] text-left px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-750 transition-colors active:scale-95"
              >
                "{cmd}"
              </button>
            ))}
          </div>
        </div>

        {/* Manual text backup input for restricted environments */}
        <div className="pt-2 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualInput.trim()) {
                handleProcessCommand(manualInput);
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="या यहाँ बोलकर/लिखकर टाइप करें..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold disabled:opacity-40"
            >
              Parse
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
