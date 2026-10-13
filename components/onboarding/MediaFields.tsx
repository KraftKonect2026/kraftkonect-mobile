import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { AppText } from "@/components/AppText";
import Colors from "@/constants/colors";
import { Corners, Space } from "@/constants/layout";

export type PublicPhotoKind = "banner" | "avatar" | "gallery" | "servicePhoto";
export function photoSource(value: string) {
  if (value === "sample-avatar") return require("@/assets/onboarding/29380.png");
  if (value.startsWith("sample-")) return require("@/assets/design/1b9df.png");
  return { uri: value };
}
function Camera() {
  return <View style={styles.camera}><Image source={require("@/assets/onboarding/702e9.svg")} style={{ width: 24, height: 24 }} /></View>;
}
export function ProfilePhotos({ banner, avatar, onPhoto,disabled=false }: { banner: string; avatar: string; onPhoto: (kind: PublicPhotoKind) => void;disabled?:boolean }) {
  return <View style={styles.profilePhotos}>
    <Pressable accessibilityRole="button" accessibilityLabel="Choose provider cover photo" accessibilityState={{disabled}} disabled={disabled} onPress={() => onPhoto("banner")} style={styles.banner}>
      {banner ? <Image source={photoSource(banner)} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      <Camera />
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Choose profile photo" accessibilityState={{disabled}} disabled={disabled} onPress={() => onPhoto("avatar")} style={[styles.avatar, avatar === "sample-avatar" && { borderWidth: 0, overflow: "visible", backgroundColor: "transparent" }]}>
      {avatar ? <Image source={photoSource(avatar)} style={avatar === "sample-avatar" ? { position: "absolute", width: 80, height: 80, left: -2, top: -1 } : StyleSheet.absoluteFill} contentFit="cover" /> : null}
      <Camera />
    </Pressable>
  </View>;
}
export function WorkPhotos({ photos, onAdd, onRemove }: { photos: string[]; onAdd: () => void; onRemove: (index: number) => void }) {
  const { width } = useWindowDimensions();
  const tileWidth = Math.min(108, (width - Space.page * 2 - 20) / 3);
  return <View style={{ gap: 10 }}>
    <AppText variant="labelSmall">Work photos</AppText>
    <View style={styles.tiles}>
      {photos.map((photo, i) => <View key={photo + i} style={{ width: tileWidth, height: 80 }}>
        <Image source={photoSource(photo)} style={{ width: tileWidth, height: 80, borderRadius: Corners.large }} contentFit="cover" />
        <Pressable accessibilityRole="button" accessibilityLabel={"Remove work photo " + (i + 1)} onPress={() => onRemove(i)} style={styles.remove}>
          <Image source={require("@/assets/onboarding/91c63.svg")} style={{ width: 16, height: 16 }} />
        </Pressable>
      </View>)}
      {photos.length < 8 ? <Pressable accessibilityRole="button" accessibilityLabel="Add work photo" onPress={onAdd} style={[styles.add, { width: tileWidth }]}>
        <Image source={require("@/assets/onboarding/49a3c.svg")} style={{ width: 24, height: 24 }} />
      </Pressable> : null}
    </View>
  </View>;
}
export function ServicePhoto({ photo, onPress }: { photo: string; onPress: () => void }) {
  return <View style={{ gap: 10 }}><AppText variant="labelSmall">Service photo</AppText>
    <Pressable accessibilityRole="button" accessibilityLabel="Choose service photo" onPress={onPress} style={styles.servicePhoto}>
      {photo ? <Image source={photoSource(photo)} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}<Camera />
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({
  profilePhotos: { height: 182 },
  banner: { height: 144, borderRadius: Corners.large, backgroundColor: Colors.primarySoft, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  avatar: { position: "absolute", width: 76, height: 76, top: 106, alignSelf: "center", borderRadius: Corners.full, borderWidth: 4, borderColor: Colors.surface, backgroundColor: Colors.primarySoft, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  camera: { width: 40, height: 40, borderRadius: Corners.full, backgroundColor: "rgba(15,23,42,0.2)", alignItems: "center", justifyContent: "center" },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  remove: { position: "absolute", right: -6, bottom: -6, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  add: { height: 80, borderRadius: Corners.control, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.textPrimary, alignItems: "center", justifyContent: "center" },
  servicePhoto: { width: 108, height: 80, borderRadius: Corners.large, backgroundColor: Colors.primarySoft, overflow: "hidden", alignItems: "center", justifyContent: "center" },
});
