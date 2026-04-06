import Foundation

/// Direct HTTP client for the EchoMind backend API.
/// Mirrors the RN `api/client.ts` but uses native URLSession.
actor APIClient {
    static let shared = APIClient()

    private let baseURL = "https://echomind.ulme.cn/api/v1"
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 60
        config.timeoutIntervalForResource = 120
        config.waitsForConnectivity = true
        self.session = URLSession(configuration: config)

        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
    }

    // MARK: - Token Access

    private var accessToken: String? {
        UserDefaults.standard.string(forKey: "access_token")
    }

    private var refreshToken: String? {
        UserDefaults.standard.string(forKey: "refresh_token")
    }

    private func saveTokens(access: String, refresh: String) {
        UserDefaults.standard.set(access, forKey: "access_token")
        UserDefaults.standard.set(refresh, forKey: "refresh_token")
    }

    private func clearTokens() {
        UserDefaults.standard.removeObject(forKey: "access_token")
        UserDefaults.standard.removeObject(forKey: "refresh_token")
    }

    // MARK: - Public API

    /// POST /ai/autofill — get AI-suggested title, mood, tags
    func autofill(transcript: String) async throws -> AutofillResult {
        let payload = AutofillPayload(transcript: transcript)
        return try await post("/ai/autofill", body: payload)
    }

    /// POST /dreams — create a new dream record
    func createDream(_ payload: CreateDreamPayload) async throws -> Dream {
        return try await post("/dreams", body: payload)
    }

    /// PATCH /dreams/{id} — update dream fields
    func updateDream(id: String, payload: UpdateDreamPayload) async throws -> Dream {
        return try await patch("/dreams/\(id)", body: payload)
    }

    /// POST /dreams/{id}/ai-image — generate an AI image
    func generateImage(dreamId: String, style: String) async throws -> Dream {
        let payload = GenerateImagePayload(style: style)
        return try await post("/dreams/\(dreamId)/ai-image", body: payload)
    }

    // MARK: - HTTP Helpers

    private func post<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T {
        return try await request(path, method: "POST", body: body)
    }

    private func patch<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T {
        return try await request(path, method: "PATCH", body: body)
    }

    private func request<T: Decodable, B: Encodable>(
        _ path: String,
        method: String,
        body: B
    ) async throws -> T {
        guard let token = accessToken else {
            throw APIError.unauthenticated
        }

        let result: T = try await makeRequest(path, method: method, body: body, token: token)
        return result
    }

    private func makeRequest<T: Decodable, B: Encodable>(
        _ path: String,
        method: String,
        body: B,
        token: String
    ) async throws -> T {
        let urlString = "\(baseURL)\(path)"
        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL(urlString)
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("no-cache, no-store, must-revalidate", forHTTPHeaderField: "Cache-Control")
        request.httpBody = try encoder.encode(body)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        // Handle 401 — try token refresh once
        if httpResponse.statusCode == 401 {
            if let newToken = try await refreshTokens() {
                // Retry with new token
                var retryRequest = request
                retryRequest.setValue("Bearer \(newToken)", forHTTPHeaderField: "Authorization")
                let (retryData, retryResponse) = try await session.data(for: retryRequest)
                guard let retryHTTP = retryResponse as? HTTPURLResponse else {
                    throw APIError.invalidResponse
                }
                if retryHTTP.statusCode == 401 {
                    throw APIError.unauthenticated
                }
                guard (200...299).contains(retryHTTP.statusCode) else {
                    let detail = extractDetail(from: retryData)
                    throw APIError.serverError(retryHTTP.statusCode, detail)
                }
                return try decoder.decode(T.self, from: retryData)
            } else {
                throw APIError.unauthenticated
            }
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let detail = extractDetail(from: data)
            throw APIError.serverError(httpResponse.statusCode, detail)
        }

        return try decoder.decode(T.self, from: data)
    }

    private func refreshTokens() async throws -> String? {
        guard let refresh = refreshToken else { return nil }

        let urlString = "\(baseURL)/auth/refresh"
        guard let url = URL(string: urlString) else { return nil }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.httpBody = try encoder.encode(["refresh_token": refresh])

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            clearTokens()
            return nil
        }

        struct RefreshResponse: Decodable {
            let access_token: String
            let refresh_token: String
        }

        let tokens = try decoder.decode(RefreshResponse.self, from: data)
        saveTokens(access: tokens.access_token, refresh: tokens.refresh_token)
        return tokens.access_token
    }

    private func extractDetail(from data: Data) -> String {
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let detail = json["detail"] as? String {
            return detail
        }
        return String(data: data, encoding: .utf8) ?? "Unknown error"
    }
}

// MARK: - API Errors

enum APIError: LocalizedError {
    case unauthenticated
    case invalidURL(String)
    case invalidResponse
    case serverError(Int, String)

    var errorDescription: String? {
        switch self {
        case .unauthenticated:
            return "Please log in on your iPhone first."
        case .invalidURL(let url):
            return "Invalid URL: \(url)"
        case .invalidResponse:
            return "Received an invalid response from the server."
        case .serverError(let code, let detail):
            return "Server error (\(code)): \(detail)"
        }
    }
}
