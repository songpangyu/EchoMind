#import "WatchTokenBridge.h"
#import <WatchConnectivity/WatchConnectivity.h>

@interface WatchTokenBridge () <WCSessionDelegate>
@end

@implementation WatchTokenBridge

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        if ([WCSession isSupported]) {
            WCSession *session = [WCSession defaultSession];
            session.delegate = self;
            [session activateSession];
        }
    }
    return self;
}

/// Called from JS: WatchTokenBridge.syncTokens(accessToken, refreshToken)
RCT_EXPORT_METHOD(syncTokens:(NSString *)accessToken
                  refreshToken:(NSString *)refreshToken) {
    if (![WCSession isSupported]) {
        NSLog(@"[WatchTokenBridge] WCSession not supported on this device");
        return;
    }

    WCSession *session = [WCSession defaultSession];

    if (!session.isPaired) {
        NSLog(@"[WatchTokenBridge] No paired Apple Watch found");
        return;
    }

    if (!session.isWatchAppInstalled) {
        NSLog(@"[WatchTokenBridge] Watch app not installed — sending via applicationContext for later");
    }

    NSDictionary *tokenPayload = @{
        @"access_token": accessToken,
        @"refresh_token": refreshToken
    };

    // Use transferUserInfo for guaranteed delivery (queued, survives app kill)
    [session transferUserInfo:tokenPayload];

    // Also update applicationContext for immediate access when Watch app launches
    NSError *error = nil;
    [session updateApplicationContext:tokenPayload error:&error];
    if (error) {
        NSLog(@"[WatchTokenBridge] Failed to update application context: %@", error.localizedDescription);
    }

    NSLog(@"[WatchTokenBridge] Tokens synced to Apple Watch (transferUserInfo + applicationContext)");
}

/// Called from JS when user logs out: WatchTokenBridge.clearTokens()
RCT_EXPORT_METHOD(clearTokens) {
    if (![WCSession isSupported]) return;

    WCSession *session = [WCSession defaultSession];
    if (!session.isPaired) return;

    NSDictionary *logoutPayload = @{ @"action": @"logout" };
    [session transferUserInfo:logoutPayload];

    NSError *error = nil;
    [session updateApplicationContext:logoutPayload error:&error];

    NSLog(@"[WatchTokenBridge] Logout signal sent to Apple Watch");
}

// MARK: - WCSessionDelegate (minimal — iPhone side only needs activation)

- (void)session:(WCSession *)session activationDidCompleteWithState:(WCSessionActivationState)activationState error:(NSError *)error {
    if (error) {
        NSLog(@"[WatchTokenBridge] WCSession activation failed: %@", error.localizedDescription);
    } else {
        NSLog(@"[WatchTokenBridge] WCSession activated with state: %ld", (long)activationState);
    }
}

- (void)sessionDidBecomeInactive:(WCSession *)session {
    NSLog(@"[WatchTokenBridge] WCSession became inactive");
}

- (void)sessionDidDeactivate:(WCSession *)session {
    // Re-activate for multi-watch support
    [session activateSession];
}

@end
