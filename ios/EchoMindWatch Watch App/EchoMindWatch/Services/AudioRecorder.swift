import AVFoundation
import Speech
import SwiftUI

/// Handles microphone recording on Apple Watch with real-time speech-to-text.
/// Uses AVAudioRecorder for audio capture and SFSpeechRecognizer for transcription.
class AudioRecorder: NSObject, ObservableObject {
    @Published var isRecording = false
    @Published var isPaused = false
    @Published var transcript = ""
    @Published var duration: TimeInterval = 0
    @Published var errorMessage: String?
    @Published var audioLevel: Float = 0.0

    private var audioRecorder: AVAudioRecorder?
    private var speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var audioEngine: AVAudioEngine?
    private var timer: Timer?
    private var levelTimer: Timer?

    private var accumulatedTranscript = ""
    private var livePartial = ""

    override init() {
        super.init()
        speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    }

    // MARK: - Public

    func startRecording() {
        errorMessage = nil
        accumulatedTranscript = ""
        livePartial = ""
        transcript = ""
        duration = 0

        requestPermissionsAndStart()
    }

    func pauseRecording() {
        guard isRecording, !isPaused else { return }

        // Stop the speech recognition but keep state
        audioEngine?.pause()
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest = nil

        // Accumulate whatever we have
        accumulatedTranscript = transcript

        isPaused = true
        timer?.invalidate()
        levelTimer?.invalidate()

        print("[AudioRecorder] Paused")
    }

    func resumeRecording() {
        guard isRecording, isPaused else { return }

        isPaused = false
        startSpeechRecognition(resume: true)
        startTimers()

        print("[AudioRecorder] Resumed")
    }

    func stopRecording() -> String {
        audioEngine?.stop()
        audioEngine?.inputNode.removeTap(onBus: 0)
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest?.endAudio()
        recognitionRequest = nil

        timer?.invalidate()
        levelTimer?.invalidate()
        timer = nil
        levelTimer = nil

        isRecording = false
        isPaused = false
        audioLevel = 0.0

        // Final transcript
        let finalTranscript = transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        print("[AudioRecorder] Stopped. Final transcript: \(finalTranscript.prefix(80))...")
        return finalTranscript
    }

    func reset() {
        _ = stopRecording()
        transcript = ""
        accumulatedTranscript = ""
        livePartial = ""
        duration = 0
        errorMessage = nil
    }

    // MARK: - Permissions

    private func requestPermissionsAndStart() {
        // Request microphone permission
        AVAudioApplication.requestRecordPermission { [weak self] granted in
            DispatchQueue.main.async {
                guard granted else {
                    self?.errorMessage = "Microphone permission denied. Please enable it in Settings."
                    return
                }
                // Request speech recognition permission
                SFSpeechRecognizer.requestAuthorization { [weak self] status in
                    DispatchQueue.main.async {
                        switch status {
                        case .authorized:
                            self?.beginRecordingSession()
                        case .denied:
                            self?.errorMessage = "Speech recognition denied. Please enable it in Settings."
                        case .restricted:
                            self?.errorMessage = "Speech recognition is restricted on this device."
                        case .notDetermined:
                            self?.errorMessage = "Speech recognition not yet authorized."
                        @unknown default:
                            self?.errorMessage = "Unknown speech recognition status."
                        }
                    }
                }
            }
        }
    }

    // MARK: - Recording Session

    private func beginRecordingSession() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            errorMessage = "Failed to configure audio session: \(error.localizedDescription)"
            return
        }

        isRecording = true
        isPaused = false
        startSpeechRecognition(resume: false)
        startTimers()
    }

    // MARK: - Speech Recognition

    private func startSpeechRecognition(resume: Bool) {
        guard let speechRecognizer = speechRecognizer, speechRecognizer.isAvailable else {
            errorMessage = "Speech recognition is not available."
            return
        }

        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else {
            errorMessage = "Could not create speech recognition request."
            return
        }

        recognitionRequest.shouldReportPartialResults = true

        // Set up audio engine
        audioEngine = AVAudioEngine()
        guard let audioEngine = audioEngine else {
            errorMessage = "Could not create audio engine."
            return
        }

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)

        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()

        do {
            try audioEngine.start()
        } catch {
            errorMessage = "Could not start audio engine: \(error.localizedDescription)"
            return
        }

        recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self = self else { return }

            if let result = result {
                let partial = result.bestTranscription.formattedString
                DispatchQueue.main.async {
                    self.livePartial = partial
                    if self.accumulatedTranscript.isEmpty {
                        self.transcript = partial
                    } else {
                        self.transcript = self.accumulatedTranscript + " " + partial
                    }
                }

                if result.isFinal {
                    DispatchQueue.main.async {
                        self.accumulatedTranscript = self.transcript
                        self.livePartial = ""
                    }
                }
            }

            if let error = error {
                // Ignore cancellation errors (normal during pause/stop)
                let nsError = error as NSError
                if nsError.domain == "kAFAssistantErrorDomain" && nsError.code == 216 {
                    // "kAFAssistantErrorDomain error 216" = cancelled, ignore
                    return
                }
                DispatchQueue.main.async {
                    if self.isRecording && !self.isPaused {
                        self.errorMessage = error.localizedDescription
                    }
                }
            }
        }
    }

    // MARK: - Timers

    private func startTimers() {
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            DispatchQueue.main.async {
                self?.duration += 1
            }
        }
    }
}
