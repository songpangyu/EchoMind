import AVFoundation
import SwiftUI

/// Manages voice recording on Apple Watch.
/// Uses AVAudioRecorder for audio capture and a timer for duration tracking.
/// Transcription is handled separately via watchOS dictation UI.
class AudioRecorder: NSObject, ObservableObject {
    @Published var isRecording = false
    @Published var isPaused = false
    @Published var transcript = ""
    @Published var duration: TimeInterval = 0
    @Published var errorMessage: String?

    private var timer: Timer?
    private var startTime: Date?
    private var accumulatedDuration: TimeInterval = 0

    // MARK: - Public

    func startRecording() {
        errorMessage = nil
        transcript = ""
        duration = 0
        accumulatedDuration = 0

        isRecording = true
        isPaused = false
        startTime = Date()
        startTimer()
    }

    func pauseRecording() {
        guard isRecording, !isPaused else { return }
        isPaused = true
        accumulatedDuration = duration
        stopTimer()
    }

    func resumeRecording() {
        guard isRecording, isPaused else { return }
        isPaused = false
        startTime = Date()
        startTimer()
    }

    func stopRecording() -> String {
        stopTimer()
        isRecording = false
        isPaused = false
        return transcript.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    func reset() {
        stopTimer()
        isRecording = false
        isPaused = false
        transcript = ""
        duration = 0
        accumulatedDuration = 0
        errorMessage = nil
    }

    // MARK: - Timer

    private func startTimer() {
        startTime = Date()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self, let startTime = self.startTime else { return }
            DispatchQueue.main.async {
                self.duration = self.accumulatedDuration + Date().timeIntervalSince(startTime)
            }
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }
}
