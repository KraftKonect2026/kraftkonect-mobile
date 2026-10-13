import { Pressable, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { Input } from "@/components/Input";
import { Callout } from "@/components/Callout";
import Colors from "@/constants/colors";
import { DetailCard } from "./Parts";

export function ReviewFields({ rating, text, onRating, onText }: { rating: number; text: string; onRating: (value: number) => void; onText: (value: string) => void }) {
  const { width } = useWindowDimensions();
  return <>
    <DetailCard title="Choose a rating"><View accessibilityRole="radiogroup" accessibilityLabel="Rating" style={{ flexDirection: "row", gap: width < 340 ? 4 : 8 }}>
      {[1, 2, 3, 4, 5].map(value => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={"Rate " + value + " stars"} accessibilityState={{ checked: rating === value }} aria-checked={rating === value} onPress={() => onRating(value)} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: Colors.controlQuiet, alignItems: "center", justifyContent: "center", opacity: value <= rating ? 1 : 0.3 }}><Image source={value <= rating ? require("@/assets/bookings/8b741.svg") : require("@/assets/bookings/0e66f.svg")} style={{ width: 24, height: 24 }} contentFit="contain" accessible={false} /></View>
      </Pressable>)}
    </View></DetailCard>
    <Input label="Your review" multiline value={text} maxLength={500} onChangeText={onText} />
    <Callout title="Your review" message="Only share details about this completed service. Written feedback is optional." />
  </>;
}
