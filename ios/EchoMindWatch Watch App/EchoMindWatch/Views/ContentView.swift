import SwiftUI
import WatchKit
import Combine

struct ContentView: View {
    @EnvironmentObject var authSync: AuthSync
    @StateObject private var recorder = AudioRecorder()
    @State private var currentScreen: WatchScreen = .idle
    @State private var showingTextInput = false
    @State private var dictationText = ""

    enum WatchScreen {
        case idle
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
                        dictationText = ""
                        showingTextInput = true
                    })
                    .sheet(isPresented: $showingTextInput) {
                        DictationSheetView(text: $dictationText, isPresented: $showingTextInput) {
                            if !dictationText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                                recorder.transcript = dictationText
                                currentScreen = .confirm
                            }
                        }
                    }

                case .confirm:
                    ConfirmView(
                        transcript: recorder.transcript,
                        duration: 0,
                        onReRecord: {
                            recorder.reset()
                            currentScreen = .idle
                            // Small delay then re-open dictation
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                                dictationText = ""
                                showingTextInput = true
                            }
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

// MARK: - Dictation Sheet (auto-focuses TextField to trigger system dictation)

struct DictationSheetView: View {
    @Binding var text: String
    @Binding var isPresented: Bool
    let onDone: () -> Void
    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(spacing: 8) {
            Text("🌙 Describe your dream")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(.echoMintGreen)

            TextField("Tap mic to speak...", text: $text, axis: .vertical)
                .font(.system(size: 13))
                .lineLimit(2...8)
                .padding(8)
                .background(Color.echoSurface)
                .cornerRadius(8)
                .focused($isFocused)

            if !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                Button(action: {
                    isPresented = false
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                        onDone()
                    }
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
        .onAppear {
            // Auto-focus → on real Watch this opens system dictation immediately
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
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
