import SwiftUI

@main
struct EchoMindWatchApp: App {
    @StateObject private var authSync = AuthSync()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authSync)
        }
    }
}
