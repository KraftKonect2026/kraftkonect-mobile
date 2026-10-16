import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useApolloClient } from "@apollo/client";
import { AppText } from "@/components/AppText";
import Colors from "@/constants/colors";
import { useAppSelector } from "@/store";
import { cardLabel, loadCards, paymentChoice, SavedCard } from "@/lib/payments/liveCards";

/**
 * "Pay with": the cards saved on this account, or the secure checkout page (any card or bank transfer).
 * The pick is held in paymentChoice and goes with the payment when the person taps the pay button.
 */
export function PaymentChoice() {
  const client = useApolloClient(), ownerId = useAppSelector(s => s.auth.user?.id);
  const [cards, setCards] = useState<SavedCard[]>(), [pick, setPick] = useState<string | null>(null), [save, setSave] = useState(false);
  useEffect(() => {
    paymentChoice.reset();
    if (!ownerId) return;
    let alive = true;
    // If the cards cannot be loaded the person can still pay on the secure checkout page.
    loadCards(client, ownerId).then(list => { if (!alive) return; setCards(list); const first = list.find(c => !c.expired); if (first) setPick(first.id); }).catch(() => { if (alive) setCards([]); });
    return () => { alive = false; };
  }, [client, ownerId]);
  useEffect(() => { paymentChoice.set({ cardId: pick, saveCard: save }); }, [pick, save]);
  if (!cards) return <AppText variant="bodySmall" color={Colors.textSecondary}>Loading your payment options…</AppText>;

  const row = (key: string, label: string, detail: string | undefined, selected: boolean, onPress: () => void, disabled = false) => (
    <Pressable key={key} accessibilityRole="radio" accessibilityState={{ selected, disabled }} accessibilityLabel={label} disabled={disabled} onPress={onPress}
      style={{ minHeight: 56, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, borderColor: selected ? Colors.primary : Colors.border, opacity: disabled ? 0.5 : 1 }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: selected ? Colors.primary : Colors.borderControl, alignItems: "center", justifyContent: "center" }}>
        {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary }} />}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="labelSupport">{label}</AppText>
        {detail && <AppText variant="bodySmall" color={Colors.textSecondary}>{detail}</AppText>}
      </View>
    </Pressable>
  );
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="label">Pay with</AppText>
      {cards.map(c => row(c.id, cardLabel(c), c.expired ? "Expired" : undefined, pick === c.id, () => setPick(c.id), c.expired))}
      {row("new", cards.length ? "Another card or bank transfer" : "Card or bank transfer", "Opens Paystack’s secure checkout", pick === null, () => setPick(null))}
      {pick === null && (
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: save }} accessibilityLabel="Save this card for next time" onPress={() => setSave(v => !v)} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: save ? Colors.primary : Colors.borderControl, backgroundColor: save ? Colors.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
            {save && <AppText variant="label" color="#FFFFFF" style={{ lineHeight: 16, fontSize: 14 }}>✓</AppText>}
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodySmall">Save this card for next time</AppText>
            <AppText variant="captionRegular" color={Colors.textSecondary}>Only if your card allows it. You can remove it any time in Payments.</AppText>
          </View>
        </Pressable>
      )}
    </View>
  );
}
