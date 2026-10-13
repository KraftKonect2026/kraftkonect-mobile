import { Space, Corners } from "@/constants/layout";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AvailabilityOption } from "@/components/provider/ProviderManagementScreens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApolloClient, useMutation } from "@apollo/client";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import Colors from "@/constants/colors";
import { SET_AVAILABILITY_MUTATION } from "@/lib/mutations";
import { useToast } from "@/lib/toast";
import { useAppSelector, store } from "@/store";
import { MY_PROVIDER_PROFILE_QUERY, USER_PROFILE_QUERY } from "@/lib/queries";
import { sameAccountSession } from "@/lib/account/liveAccount";
import { saveOwnedRequestStatus } from "@/lib/provider/liveCatalog";

export function AvailabilitySheet({ available, providerId, onClose, onSaved, onDates, previewSave }: {
  available?: boolean; providerId?:string; onClose: () => void; onSaved: () => void; onDates: () => void;
  previewSave?: (available: boolean) => void;
}) {
  const [selected, setSelected] = useState(available);
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const client=useApolloClient(),ownerId=useAppSelector(s=>s.auth.user?.id),alive=useRef(true),locked=useRef(false);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const [saveAvailability] = useMutation(SET_AVAILABILITY_MUTATION, { errorPolicy: "none" });
  const onSave = async () => {
    if(selected===undefined||locked.current)return;
    if (previewSave) { previewSave(selected); onClose(); return; }
    if(!ownerId||!providerId)return;
    const id=ownerId,context={accountOwnerId:id,queryDeduplication:false};
    const current=()=>{const auth=store.getState().auth;return alive.current&&sameAccountSession(id,auth.user?.id,auth.isAuthenticated&&!!auth.accessToken);};
    locked.current=true;
    setSaving(true);
    try {
      await saveOwnedRequestStatus(id,providerId,selected,{
        me:async()=>(await client.query({query:USER_PROFILE_QUERY,fetchPolicy:"no-cache",context})).data?.me,
        profile:async()=>(await client.query({query:MY_PROVIDER_PROFILE_QUERY,fetchPolicy:"no-cache",context})).data?.myProviderProfile,
        save:async value=>(await saveAvailability({variables:{available:value},context})).data?.setAvailability,
        isCurrent:current,
      });
      if(!current())return;
      onSaved();
      onClose();
      toast.success("Request status saved.");
    } catch { if(current())toast.error("Couldn’t save request status. Your selection is kept."); }
    finally { locked.current=false;if(current())setSaving(false); }
  };
  return <Modal visible transparent animationType="slide" onRequestClose={() => { if (!saving) onClose(); }}>
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close availability" onPress={onClose} disabled={saving} />
      <ScrollView style={styles.sheet} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]} keyboardShouldPersistTaps="handled">
        <View style={{ gap: Space.xs }}>
          <AppText variant="h2">Your availability</AppText>
          <AppText variant="body" color={Colors.textSecondary}>Choose when you’re open to new requests.</AppText>
        </View>
        <View accessibilityRole="radiogroup" accessibilityLabel="Availability" style={{ gap: Space.md }}>
          {[true,false].map(value=><AvailabilityOption key={String(value)} value={value} selected={selected===value} disabled={saving} onPress={()=>setSelected(value)}/>)}
        </View>
        <Callout message="This changes whether you accept new requests. Weekly working days could not be loaded; prepare them separately." />
        <Button title="Manage working days" variant="outline" onPress={onDates} disabled={saving} />
        <AppText variant="bodySmall" color={Colors.textSecondary}>Your existing bookings won’t be affected.</AppText>
        <Button title="Save" onPress={onSave} loading={saving} disabled={selected===undefined||!previewSave&&(!ownerId||!providerId)} />
        <Button title="Close" variant="subtle" onPress={onClose} disabled={saving} />
      </ScrollView>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: Colors.overlay },
  sheet: { flexGrow: 0, maxHeight: "90%", backgroundColor: Colors.surface, borderTopLeftRadius: Corners.sheet, borderTopRightRadius: Corners.sheet },
  content: { paddingTop: Space.page, paddingHorizontal: Space.page, gap: Space.xl },
  option: { borderWidth: 1, borderColor: Colors.border, borderRadius: Corners.large, padding: Space.lg, minHeight: 80, flexDirection: "row", alignItems: "center", gap: Space.md },
  selected: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
});
