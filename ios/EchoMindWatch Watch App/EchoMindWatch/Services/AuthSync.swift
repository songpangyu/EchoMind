import Foundation
import WatchConnectivity

/// Receives JWT tokens from the iPhone app via WCSession.
/// Tokens are persisted in UserDefaults so they survive app restarts.
class AuthSync: NSObject, ObservableObject, WCSessionDelegate {
    @Published var isAuthenticated: Bool = false

    override init() {
        super.init()

        // Restore tokens from previous session
        let hasToken = UserDefaults.standard.string(forKey: "access_token") != nil
        isAuthenticated = hasToken

        // Activate WatchConnectivity to receive tokens from iPhone
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }

    // MARK: - WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            print("[AuthSync] WCSession activation failed: \(error.localizedDescription)")
        } else {
            print("[AuthSync] WCSession activated with state: \(activationState.rawValue)")
        }
    }

    /// Called when iPhone sends tokens via transferUserInfo
    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        handleTokenPayload(userInfo)
    }

    /// Called when iPhone sends tokens via sendMessage (app in foreground)
    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        handleTokenPayload(message)
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        handleTokenPayload(message)
        replyHandler(["status": "received"])
    }

    /// Also check applicationContext for tokens (set when Watch app wasn't running)
    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        handleTokenPayload(applicationContext)
    }

    // MARK: - Token Handling

    private func handleTokenPayload(_ payload: [String: Any]) {
        guard let accessToken = payload["access_token"] as? String,
              let refreshToken = payload["refresh_token"] as? String else {
            // Check for logout signal
            if let action = payload["action"] as? String, action == "logout" {
                DispatchQueue.main.async {
                    self.clearTokens()
                }
            }
            return
        }

        DispatchQueue.main.async {
            UserDefaults.standard.set(accessToken, forKey: "access_token")
            UserDefaults.standard.set(refreshToken, forKey: "refresh_token")
            self.isAuthenticated = true
            print("[AuthSync] Tokens received and saved from iPhone")
        }
    }

    func clearTokens() {
        UserDefaults.standard.removeObject(forKey: "access_token")
        UserDefaults.standard.removeObject(forKey: "refresh_token")
        isAuthenticated = false
        print("[AuthSync] Tokens cleared")
    }
}
