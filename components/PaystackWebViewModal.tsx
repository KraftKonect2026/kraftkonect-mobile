import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, AlertCircle } from "lucide-react-native";
import Colors from "@/constants/colors";

// A standard mobile-browser UA. Paystack's hosted checkout — and the bank's
// 3-D Secure/OTP page it loads inside itself — can render a blank page when it
// detects the default RN WebView UA (which advertises itself as an embedded
// "wv" browser), so we present as regular mobile Safari/Chrome instead.
const USER_AGENT = Platform.select({
  ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  android:
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36",
  default: undefined,
});

// The URL Paystack redirects to after hosted checkout completes.
// Must match the PAYSTACK_CALLBACK_URL on the backend.
// The WebView detects navigation to this URL — it doesn't need to resolve.
export const PAYSTACK_CHECKOUT_CALLBACK = "https://kraftkonect.com/payment/callback";

// Intercepts Paystack's postMessage events from within the WebView and
// forwards them to React Native. Paystack fires
// { event: 'successful' | 'failed' | 'cancelled', reference? }
// when the payment flow ends — works even without a callback_url.
const PAYSTACK_BRIDGE_JS = `
(function() {
  function forward(data) {
    try {
      var msg = typeof data === 'string' ? data : JSON.stringify(data);
      window.ReactNativeWebView.postMessage(msg);
    } catch(_) {}
  }
  window.addEventListener('message', function(e) {
    if (e.data && (typeof e.data === 'object' || typeof e.data === 'string')) {
      forward(e.data);
    }
  });
  var _orig = window.postMessage.bind(window);
  window.postMessage = function(msg, origin) {
    forward(msg);
    _orig(msg, origin || '*');
  };
})();
true;
`;

interface Props {
  visible: boolean;
  authorizationUrl: string;
  onPaymentDone: () => void;
  onCancel: () => void;
}

export default function PaystackWebViewModal({
  visible,
  authorizationUrl,
  onPaymentDone,
  onCancel,
}: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const doneRef = useRef(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (visible) {
      doneRef.current = false;
      setLoading(true);
      setHasError(false);
    }
  }, [visible]);

  function handleRetry() {
    setHasError(false);
    setLoading(true);
    webViewRef.current?.reload();
  }

  function fire(success: boolean) {
    if (doneRef.current) return;
    doneRef.current = true;
    if (success) onPaymentDone();
    else onCancel();
  }

  // Catch Paystack inline postMessage events (fires for both inline and hosted)
  function handleMessage(event: { nativeEvent: { data: string } }) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (!data?.event) return;
      if (data.event === "successful") fire(true);
      else if (data.event === "failed" || data.event === "cancelled") fire(false);
    } catch (_) {}
  }

  // Primary detection for hosted checkout:
  // Paystack redirects to callback_url when done (success or failure).
  // We close the modal on any navigation away from Paystack's domain.
  function handleNavChange(nav: WebViewNavigation) {
    const { url } = nav;
    if (!url || doneRef.current) return;

    // Explicit callback URL match
    if (url.startsWith(PAYSTACK_CHECKOUT_CALLBACK)) {
      fire(true);
      return;
    }

    // Generic fallback: left Paystack's domain
    if (
      !url.includes("checkout.paystack.com") &&
      !url.includes("paystack.co") &&
      !url.startsWith("about:") &&
      !url.startsWith("data:")
    ) {
      fire(true);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => fire(false)}
      statusBarTranslucent
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Secure Payment</Text>
          <TouchableOpacity
            onPress={() => fire(false)}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={24} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {Platform.OS !== "web" && (
          <>
            <WebView
              ref={webViewRef}
              source={{ uri: authorizationUrl }}
              style={styles.webview}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setHasError(true);
              }}
              onHttpError={() => {
                setLoading(false);
                setHasError(true);
              }}
              onNavigationStateChange={handleNavChange}
              onMessage={handleMessage}
              injectedJavaScript={PAYSTACK_BRIDGE_JS}
              javaScriptEnabled
              domStorageEnabled
              userAgent={USER_AGENT}
              originWhitelist={["*"]}
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              javaScriptCanOpenWindowsAutomatically
              setSupportMultipleWindows={false}
            />
            {loading && !hasError && (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loaderText}>Loading secure payment…</Text>
              </View>
            )}
            {hasError && (
              <View style={styles.loader}>
                <AlertCircle size={32} color="#DC2626" strokeWidth={2} />
                <Text style={styles.loaderText}>
                  Couldn't load the payment page. Check your connection and try again.
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleRetry}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {Platform.OS === "web" && (
          <View style={styles.webFallback}>
            <Text style={styles.webFallbackText}>
              Complete your payment in the tab that opened. Return here after paying.
            </Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => fire(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>I've completed payment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  title: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  webview: { flex: 1 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    top: 52,
    paddingHorizontal: 32,
  },
  loaderText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
    fontSize: 15,
  },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 20,
  },
  webFallbackText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  doneButton: {
    paddingVertical: 10,
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
});
