import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoleSwitch } from "@/components/RoleSwitch";
import { DesignIcon } from "@/components/DesignIcon";
import Colors from "@/constants/colors";
import { AppMode } from "@/lib/appMode";

export function ModeHeader({ mode, onModeChange, onNotifications, showNotifications=true, showBorder=true }: {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onNotifications: () => void;
  showNotifications?: boolean;
  showBorder?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return <View style={[styles.header, { paddingTop: insets.top, borderBottomWidth:showBorder?1:0 }]}>
    <View style={[styles.row, width < 360 && showNotifications && { paddingRight: 44 }]}>
      <RoleSwitch mode={mode} onChange={onModeChange} />
      {showNotifications&&<Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={onNotifications} style={styles.notifications}>
        <DesignIcon name="bell" />
      </Pressable>}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  header: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  row: { height: 48, alignItems: "center", justifyContent: "center" },
  notifications: { position: "absolute", right: 12, top: 0, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
