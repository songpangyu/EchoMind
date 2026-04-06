import SwiftUI

/// Main entry view — shows login prompt or the recording screen.
struct ContentView: View {
    @EnvironmentObject var authSync: AuthSync
    @StateObject private var recorder = AudioRecorder()

    @State private var currentScreen: WatchScreen = .idle

    enum WatchScreen {
        case idle           // Home: big mic button
        case recording      // Recording in progress
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
                        recorder.startRecording()
                        currentScreen = .recording
                    })

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
