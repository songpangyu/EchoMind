import SwiftUI

/// Active recording screen with waveform, timer, and pause/stop controls.
struct RecordingView: View {
    @ObservedObject var recorder: AudioRecorder
    let onPause: () -> Void
    let onResume: () -> Void
    let onStop: () -> Void

    @State private var wavePhase: CGFloat = 0

    var body: some View {
        VStack(spacing: 8) {
            // Timer
            HStack(spacing: 6) {
                Circle()
                    .fill(recorder.isPaused ? Color.echoWarning : Color.echoRecordRed)
                    .frame(width: 8, height: 8)

                Text(formatDuration(recorder.duration))
                    .font(.system(size: 20, weight: .bold, design: .monospaced))
                    .foregroundColor(.echoTextPrimary)
            }
            .padding(.top, 4)

            // Waveform or paused indicator
            if recorder.isPaused {
                Text("Paused")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.echoWarning)
                    .frame(height: 30)
            } else {
                WaveformView(phase: $wavePhase)
                    .frame(height: 30)
                    .onAppear {
                        withAnimation(.linear(duration: 1.0).repeatForever(autoreverses: false)) {
                            wavePhase = .pi * 2
                        }
                    }
            }

            // Live transcript preview
            if !recorder.transcript.isEmpty {
                ScrollView {
                    Text(recorder.transcript)
                        .font(.system(size: 11))
                        .foregroundColor(.echoTextSecondary)
                        .lineLimit(3)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .frame(maxHeight: 40)
                .padding(.horizontal, 4)
            }

            Spacer()

            // Controls
            if recorder.isPaused {
                HStack(spacing: 12) {
                    // End button
                    Button(action: onStop) {
                        VStack(spacing: 2) {
                            Image(systemName: "checkmark")
                                .font(.system(size: 16, weight: .semibold))
                            Text("End")
                                .font(.system(size: 10))
                        }
                        .foregroundColor(.echoTextPrimary)
                        .frame(width: 56, height: 48)
                        .background(Color.echoSurface)
                        .cornerRadius(12)
                    }
                    .buttonStyle(.plain)

                    // Resume button
                    Button(action: onResume) {
                        VStack(spacing: 2) {
                            Image(systemName: "play.fill")
                                .font(.system(size: 16, weight: .semibold))
                            Text("Resume")
                                .font(.system(size: 10))
                        }
                        .foregroundColor(.echoDeepTeal)
                        .frame(width: 56, height: 48)
                        .background(Color.echoMintGreen)
                        .cornerRadius(12)
                    }
                    .buttonStyle(.plain)
                }
            } else {
                HStack(spacing: 12) {
                    // Pause button
                    Button(action: onPause) {
                        ZStack {
                            Circle()
                                .fill(Color.echoRecordRed.opacity(0.15))
                                .frame(width: 52, height: 52)
                                .overlay(
                                    Circle()
                                        .stroke(Color.echoRecordRed, lineWidth: 2)
                                )

                            Image(systemName: "pause.fill")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(.echoRecordRed)
                        }
                    }
                    .buttonStyle(.plain)

                    // Stop / finish button
                    Button(action: onStop) {
                        VStack(spacing: 2) {
                            Image(systemName: "stop.fill")
                                .font(.system(size: 14, weight: .semibold))
                            Text("Done")
                                .font(.system(size: 10))
                        }
                        .foregroundColor(.echoTextPrimary)
                        .frame(width: 48, height: 48)
                        .background(Color.echoSurface)
                        .cornerRadius(12)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.horizontal, 4)
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
}

// MARK: - Waveform

struct WaveformView: View {
    @Binding var phase: CGFloat
    private let barCount = 8

    var body: some View {
        HStack(spacing: 3) {
            ForEach(0..<barCount, id: \.self) { i in
                let offset = CGFloat(i) * 0.5
                let height = (sin(phase + offset) + 1) / 2 * 20 + 4
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color.echoMintGreen)
                    .frame(width: 3, height: height)
                    .animation(.easeInOut(duration: 0.3), value: phase)
            }
        }
    }
}
