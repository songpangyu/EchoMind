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
