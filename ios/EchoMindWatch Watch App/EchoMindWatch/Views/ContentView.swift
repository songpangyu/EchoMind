import SwiftUI
import Combine

struct ContentView: View {
    @EnvironmentObject var authSync: AuthSync
    @StateObject private var recorder = AudioRecorder()
    @State private var currentScreen: WatchScreen = .idle

    enum WatchScreen {
        case idle
        case voiceInput
        case confirm
        case generating
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
                        currentScreen = .voiceInput
                    })

                case .voiceInput:
                    VoiceInputView(onComplete: { text in
                        recorder.transcript = text
                        currentScreen = .confirm
                    }, onCancel: {
                        currentScreen = .idle
                    })

                case .confirm:
                    ConfirmView(
                        transcript: recorder.transcript,
                        duration: 0,
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
                        duration: 0,
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

// MARK: - Voice Input View
// On real Apple Watch: TextField auto-opens dictation (full-screen mic + waveform)
// On Simulator: shows keyboard (simulator has no mic)

struct VoiceInputView: View {
    let onComplete: (String) -> Void
    let onCancel: () -> Void

    @State private var inputText = ""
    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Button(action: onCancel) {
                    Image(systemName: "xmark")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.echoTextTertiary)
                }
                .buttonStyle(.plain)
                .frame(width: 30, height: 30)

                Spacer()

                Text("🌙 Speak")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.echoMintGreen)

                Spacer()
                Spacer().frame(width: 30)
            }

            // This TextField auto-opens system dictation on real Apple Watch
            TextField("Tap to speak...", text: $inputText, axis: .vertical)
                .font(.system(size: 13))
                .lineLimit(3...10)
                .padding(8)
                .background(Color.echoSurface)
                .cornerRadius(8)
                .focused($isFocused)

            if !inputText.isEmpty {
                Button(action: {
                    onComplete(inputText)
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 12, weight: .bold))
                        Text("Continue")
                            .font(.system(size: 14, weight: .bold))
                    }
                    .foregroundColor(.echoDeepTeal)
                    .frame(maxWidth: .infinity)
                    .frame(height: 40)
                    .background(Color.echoMintGreen)
                    .cornerRadius(10)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 4)
        .background(Color.echoBackground)
        .onAppear {
            // Auto-focus triggers system dictation on real device
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                isFocused = true
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
        }
        .padding()
    }
}

// MARK: - Idle View

struct IdleView: View {
    let onStart: () -> Void
    @State private var breatheScale: CGFloat = 1.0
    @State private var glowOpacity: Double = 0.3

    var body: some View {
        VStack(spacing: 16) {
            Spacer()
            ZStack {
                Circle()
                    .stroke(Color.echoMintGreen.opacity(glowOpacity), lineWidth: 2)
                    .frame(width: 100, height: 100)
                    .scaleEffect(breatheScale)

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
