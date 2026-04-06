import SwiftUI

/// Main entry view — shows login prompt or the recording screen.
struct ContentView: View {
    @EnvironmentObject var authSync: AuthSync
    @StateObject private var recorder = AudioRecorder()

    @State private var currentScreen: WatchScreen = .idle
    @State private var showDictation = false

    enum WatchScreen {
        case idle           // Home: big mic button
        case recording      // Recording in progress (visual timer)
        case confirm        // Review transcript
        case generating     // AI processing + results
    }

    var body: some View {
        ZStack {
            Color.echoBackground
                .ignoresSafeArea()

            if !authSync.isAuthenticated {
                LoginPromptView()
            } else {
                switch currentScreen {
                case .idle:
                    IdleView(onStart: {
                        showDictation = true
                    })
                    .sheet(isPresented: $showDictation) {
                        DictationInputView(
                            transcript: $recorder.transcript,
                            onDone: {
                                showDictation = false
                                if !recorder.transcript.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                                    currentScreen = .confirm
                                }
                            },
                            onCancel: {
                                showDictation = false
                                recorder.reset()
                            }
                        )
                    }

                case .recording:
                    RecordingView(
                        recorder: recorder,
                        onPause: {
                            recorder.pauseRecording()
                        },
                        onResume: {
                            recorder.resumeRecording()
                        },
                        onStop: {
                            _ = recorder.stopRecording()
                            currentScreen = .confirm
                        }
                    )

                case .confirm:
                    ConfirmView(
                        transcript: recorder.transcript,
                        duration: recorder.duration,
                        onReRecord: {
                            recorder.reset()
                            currentScreen = .idle
                        },
                        onGenerate: {
                            currentScreen = .generating
                        }
                    )

                case .generating:
                    GeneratingView(
                        transcript: recorder.transcript,
                        duration: recorder.duration,
                        onDone: {
                            recorder.reset()
                            currentScreen = .idle
                        }
                    )
                }
            }
        }
    }
}

// MARK: - Dictation Input View

struct DictationInputView: View {
    @Binding var transcript: String
    let onDone: () -> Void
    let onCancel: () -> Void

    @State private var inputText = ""

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                Text("Describe Your Dream")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.echoMintGreen)

                // Text field with dictation support (watchOS auto-shows mic button)
                TextField("Tap to dictate...", text: $inputText, axis: .vertical)
                    .font(.system(size: 13))
                    .foregroundColor(.echoTextPrimary)
                    .lineLimit(2...6)
                    .padding(8)
                    .background(Color.echoSurface)
                    .cornerRadius(8)

                HStack(spacing: 8) {
                    Button(action: onCancel) {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.echoTextTertiary)
                            .frame(width: 44, height: 36)
                            .background(Color.echoSurface)
                            .cornerRadius(8)
                    }
                    .buttonStyle(.plain)

                    Button(action: {
                        transcript = inputText
                        onDone()
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "checkmark")
                                .font(.system(size: 12, weight: .bold))
                            Text("Done")
                                .font(.system(size: 13, weight: .bold))
                        }
                        .foregroundColor(.echoDeepTeal)
                        .frame(maxWidth: .infinity)
                        .frame(height: 36)
                        .background(Color.echoMintGreen)
                        .cornerRadius(8)
                    }
                    .buttonStyle(.plain)
                    .disabled(inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .opacity(inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.4 : 1.0)
                }
            }
            .padding(.horizontal, 4)
            .padding(.vertical, 8)
        }
        .background(Color.echoBackground)
    }
}

// MARK: - Login Prompt

struct LoginPromptView: View {
    @State private var pulseScale: CGFloat = 1.0

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "iphone.and.arrow.forward")
                .font(.system(size: 32))
                .foregroundColor(.echoMintGreen)
                .scaleEffect(pulseScale)
                .animation(
                    .easeInOut(duration: 1.5).repeatForever(autoreverses: true),
                    value: pulseScale
                )
                .onAppear { pulseScale = 1.1 }

            Text("Open EchoMind")
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(.echoTextPrimary)

            Text("Log in on iPhone first")
                .font(.system(size: 12))
                .foregroundColor(.echoTextTertiary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}

// MARK: - Idle (Home) View

struct IdleView: View {
    let onStart: () -> Void

    @State private var breatheScale: CGFloat = 1.0
    @State private var glowOpacity: Double = 0.3

    var body: some View {
        VStack(spacing: 16) {
            Spacer()

            ZStack {
                // Outer glow ring
                Circle()
                    .stroke(Color.echoMintGreen.opacity(glowOpacity), lineWidth: 2)
                    .frame(width: 100, height: 100)
                    .scaleEffect(breatheScale)

                // Main button
                Button(action: onStart) {
                    ZStack {
                        Circle()
                            .fill(Color.echoDeepTeal)
                            .frame(width: 80, height: 80)
                            .overlay(
                                Circle()
                                    .stroke(Color.echoMintGreen, lineWidth: 2)
                            )

                        Image(systemName: "mic.fill")
                            .font(.system(size: 30, weight: .medium))
                            .foregroundColor(.echoMintGreen)
                    }
                }
                .buttonStyle(.plain)
            }
            .onAppear {
                withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
                    breatheScale = 1.12
                    glowOpacity = 0.6
                }
            }

            Text("Record Dream")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.echoTextSecondary)

            Spacer()
        }
    }
}
