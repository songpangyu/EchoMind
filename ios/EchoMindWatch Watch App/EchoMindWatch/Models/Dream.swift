import Foundation

// MARK: - Dream Model (matches RN api/dreams.ts)

struct Dream: Codable, Identifiable {
    let id: String
    let userId: String
    let sourceType: String
    let status: String
    let title: String?
    let transcript: String
    let mood: String?
    let tags: [String]
    let audioUrl: String?
    let durationSeconds: Int?
    let aiImageUrl: String?
    let aiImageStyle: String?
    let aiAutofillStatus: String
    let aiImageStatus: String
    let isFavorited: Bool
    let createdAt: String
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case sourceType = "source_type"
        case status, title, transcript, mood, tags
        case audioUrl = "audio_url"
        case durationSeconds = "duration_seconds"
        case aiImageUrl = "ai_image_url"
        case aiImageStyle = "ai_image_style"
        case aiAutofillStatus = "ai_autofill_status"
        case aiImageStatus = "ai_image_status"
        case isFavorited = "is_favorited"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Autofill Response

struct AutofillResult: Codable {
    let suggestedTitle: String
    let suggestedMood: String
    let suggestedTags: [String]
    let provider: String
    let configured: Bool
}

// MARK: - API Payloads

struct CreateDreamPayload: Encodable {
    let sourceType: String
    let transcript: String
    var title: String?
    var mood: String?
    var tags: [String]?
    var durationSeconds: Int?
    var status: String = "draft"

    enum CodingKeys: String, CodingKey {
        case sourceType = "source_type"
        case transcript, title, mood, tags
        case durationSeconds = "duration_seconds"
        case status
    }
}

struct UpdateDreamPayload: Encodable {
    var status: String?
    var title: String?
    var mood: String?
    var tags: [String]?
}

struct GenerateImagePayload: Encodable {
    let style: String
}

struct AutofillPayload: Encodable {
    let transcript: String
}
