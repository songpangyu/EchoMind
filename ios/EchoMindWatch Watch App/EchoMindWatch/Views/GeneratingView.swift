import SwiftUI

/// AI processing view that orchestrates the 4-step dream generation pipeline,
/// then displays the result (image + title + mood).
struct GeneratingView: View {
    let transcript: String
    let duration: TimeInterval
    let onDone: () -> Void

    @State private var currentStep: GenerationStep = .analyzing
    @State private var error: String?
    @State private var result: DreamResult?
    @State private var pulseScale: CGFloat = 1.0

    enum GenerationStep: Int, CaseIterable {
        case analyzing = 0      // POST /ai/autofill
        case saving = 1         // POST /dreams
        case painting = 2       // POST /dreams/{id}/ai-image
        case completing = 3     // PATCH /dreams/{id} → completed
        case done = 4

        var label: String {
            switch self {
            case .analyzing:  return "Reading your dream..."
            case .saving:     return "Saving draft..."
            case .painting:   return "Painting your dream..."
            case .completing: return "Almost done..."
            case .done:       return "Dream saved!"
            }
        }

        var icon: String {
            switch self {
            case .analyzing:  return "brain.head.profile"
            case .saving:     return "square.and.pencil"
            case .painting:   return "paintbrush.fill"
            case .completing: return "checkmark.seal.fill"
            case .done:       return "checkmark.circle.fill"
            }
        }

        var emoji: String {
            switch self {
            case .analyzing:  return "🧠"
            case .saving:     return "✍️"
            case .painting:   return "🎨"
            case .completing: return "✨"
            case .done:       return "✅"
            }
        }
    }

    struct DreamResult {
        let title: String
        let mood: String
        let tags: [String]
        let imageUrl: String?
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                if let error = error {
                    // Error state
                    errorView(error)
                } else if let result = result, currentStep == .done {
                    // Success result
                    resultView(result)
                } else {
                    // Loading / generating
                    loadingView
                }
            }
            .padding(.horizontal, 4)
            .padding(.vertical, 8)
        }
        .task {
            await runPipeline()
        }
    }

    // MARK: - Loading View

    private var loadingView: some View {
        VStack(spacing: 14) {
            Spacer()

            // Animated glow circle
            ZStack {
                Circle()
                    .stroke(Color.echoMintGreen.opacity(0.2), lineWidth: 3)
                    .frame(width: 60, height: 60)
                    .scaleEffect(pulseScale)

                Circle()
                    .fill(Color.echoDeepTeal)
                    .frame(width: 50, height: 50)

                Image(systemName: currentStep.icon)
                    .font(.system(size: 22))
                    .foregroundColor(.echoMintGreen)
            }
            .onAppear {
                withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                    pulseScale = 1.2
                }
            }

            Text(currentStep.emoji + " " + currentStep.label)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.echoTextPrimary)
                .multilineTextAlignment(.center)
                .animation(.easeInOut(duration: 0.3), value: currentStep)

            // Progress dots
            HStack(spacing: 6) {
                ForEach(0..<4, id: \.self) { i in
                    Circle()
                        .fill(i <= currentStep.rawValue ? Color.echoMintGreen : Color.echoSurface)
                        .frame(width: 6, height: 6)
                        .animation(.easeInOut(duration: 0.3), value: currentStep)
                }
            }

            Spacer()
        }
    }

    // MARK: - Result View

    private func resultView(_ result: DreamResult) -> some View {
        VStack(spacing: 10) {
            // AI Generated Image
            if let imageUrl = result.imageUrl, let url = URL(string: imageUrl) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(4/3, contentMode: .fill)
                            .frame(maxWidth: .infinity)
                            .frame(height: 100)
                            .clipped()
                            .cornerRadius(10)
                    case .failure:
                        imagePlaceholder("Failed to load")
                    case .empty:
                        ProgressView()
                            .frame(height: 100)
                    @unknown default:
                        imagePlaceholder("Loading...")
                    }
                }
            }

            // Title
            Text(result.title)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.echoTextPrimary)
                .multilineTextAlignment(.center)
                .lineLimit(2)

            // Mood + tags
            HStack(spacing: 4) {
                Text(moodEmoji(result.mood))
                    .font(.system(size: 16))

                Text(result.mood.capitalized)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.echoTextSecondary)
            }

            if !result.tags.isEmpty {
                HStack(spacing: 4) {
                    ForEach(result.tags.prefix(3), id: \.self) { tag in
                        Text(tag)
                            .font(.system(size: 9, weight: .medium))
                            .foregroundColor(.echoMintGreen)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 3)
                            .background(Color.echoMintGreen.opacity(0.15))
                            .cornerRadius(8)
                    }
                }
            }

            // Success message
            VStack(spacing: 4) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.echoMintGreen)
                    .font(.system(size: 18))

                Text("Dream Saved!")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.echoMintGreen)

                Text("Open iPhone to see details")
                    .font(.system(size: 10))
                    .foregroundColor(.echoTextTertiary)
            }
            .padding(.top, 4)

            // Done button
            Button(action: onDone) {
                Text("Done")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.echoDeepTeal)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color.echoMintGreen)
                    .cornerRadius(10)
            }
            .buttonStyle(.plain)
            .padding(.top, 4)
        }
    }

    // MARK: - Error View

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 28))
                .foregroundColor(.echoError)

            Text("Generation Failed")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.echoTextPrimary)

            Text(message)
                .font(.system(size: 11))
                .foregroundColor(.echoTextSecondary)
                .multilineTextAlignment(.center)
                .lineLimit(4)

            HStack(spacing: 8) {
                Button(action: {
                    error = nil
                    currentStep = .analyzing
                    Task { await runPipeline() }
                }) {
                    Text("Retry")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.echoDeepTeal)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color.echoMintGreen)
                        .cornerRadius(10)
                }
                .buttonStyle(.plain)

                Button(action: onDone) {
                    Text("Cancel")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.echoTextTertiary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color.echoSurface)
                        .cornerRadius(10)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.vertical, 8)
    }

    // MARK: - Helpers

    private func imagePlaceholder(_ text: String) -> some View {
        RoundedRectangle(cornerRadius: 10)
            .fill(Color.echoSurface)
            .frame(height: 100)
            .overlay(
                Text(text)
                    .font(.system(size: 11))
                    .foregroundColor(.echoTextTertiary)
            )
    }

    private func moodEmoji(_ mood: String) -> String {
        switch mood.lowercased() {
        case "peaceful": return "😌"
        case "happy":    return "😊"
        case "sad":      return "😢"
        case "anxious":  return "😰"
        case "calm":     return "😴"
        default:         return "💭"
        }
    }

    // MARK: - AI Pipeline

    private func runPipeline() async {
        let api = APIClient.shared

        do {
            // Step 1: AI Autofill
            currentStep = .analyzing
            let autofill = try await api.autofill(transcript: transcript)

            // Step 2: Create Dream (draft)
            currentStep = .saving
            var createPayload = CreateDreamPayload(
                sourceType: "voice",
                transcript: transcript
            )
            createPayload.title = autofill.suggestedTitle
            createPayload.mood = autofill.suggestedMood
            createPayload.tags = autofill.suggestedTags
            createPayload.durationSeconds = Int(duration)
            createPayload.status = "draft"

            let dream = try await api.createDream(createPayload)

            // Step 3: Generate Image (fantasy style)
            currentStep = .painting
            let imageResult = try await api.generateImage(dreamId: dream.id, style: "fantasy")

            // Step 4: Mark as completed
            currentStep = .completing
            let updatePayload = UpdateDreamPayload(status: "completed")
            _ = try await api.updateDream(id: dream.id, payload: updatePayload)

            // Done!
            currentStep = .done
            result = DreamResult(
                title: autofill.suggestedTitle,
                mood: autofill.suggestedMood,
                tags: autofill.suggestedTags,
                imageUrl: imageResult.aiImageUrl
            )

        } catch let apiError as APIError {
            error = apiError.localizedDescription
        } catch {
            self.error = error.localizedDescription
        }
    }
}
