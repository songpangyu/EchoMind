import SwiftUI

/// Review screen after recording stops. Shows transcript preview
/// with options to re-record or generate the dream via AI.
struct ConfirmView: View {
    let transcript: String
    let duration: TimeInterval
    let onReRecord: () -> Void
    let onGenerate: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                // Header
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.echoMintGreen)
                        .font(.system(size: 14))

                    Text("Recording Complete")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.echoTextPrimary)

                    Spacer()

                    Text(formatDuration(duration))
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(.echoTextTertiary)
                }

                // Transcript preview
                VStack(alignment: .leading, spacing: 6) {
                    Text("Transcript")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.echoMintGreen)
                        .textCase(.uppercase)

                    if transcript.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        Text("No speech detected. You can re-record or the AI will work with an empty transcript.")
                            .font(.system(size: 12))
                            .foregroundColor(.echoTextTertiary)
                            .italic()
                    } else {
                        Text(transcript)
                            .font(.system(size: 12))
                            .foregroundColor(.echoTextSecondary)
                            .lineLimit(6)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(10)
                .background(Color.echoSurface)
                .cornerRadius(10)

                // Action buttons
                VStack(spacing: 8) {
                    // Generate Dream button (primary)
                    Button(action: onGenerate) {
                        HStack(spacing: 6) {
                            Image(systemName: "sparkles")
                                .font(.system(size: 14))
                            Text("Generate Dream")
                                .font(.system(size: 14, weight: .bold))
                        }
                        .foregroundColor(.echoDeepTeal)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.echoMintGreen)
                        .cornerRadius(12)
                    }
                    .buttonStyle(.plain)
                    .disabled(transcript.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .opacity(transcript.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.4 : 1.0)

                    // Re-record button (secondary)
                    Button(action: onReRecord) {
                        HStack(spacing: 4) {
                            Image(systemName: "arrow.counterclockwise")
                                .font(.system(size: 12))
                            Text("Re-record")
                                .font(.system(size: 12, weight: .medium))
                        }
                        .foregroundColor(.echoTextTertiary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.echoSurface)
                        .cornerRadius(10)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 4)
            .padding(.vertical, 8)
        }
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
}
