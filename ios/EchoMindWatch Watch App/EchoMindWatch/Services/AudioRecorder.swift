import Foundation
import Combine

class AudioRecorder: NSObject, ObservableObject {
    @Published var transcript = ""
    @Published var duration: TimeInterval = 0
    @Published var errorMessage: String?

    func reset() {
        transcript = ""
        duration = 0
        errorMessage = nil
    }
}
