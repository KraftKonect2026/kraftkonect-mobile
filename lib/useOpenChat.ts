import { useCallback, useRef } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { useApolloClient } from "@apollo/client";
import { GET_CONVERSATIONS_QUERY } from "./queries";
import { store } from "@/store";
import { sameAccountSession } from "@/lib/account/liveAccount";
import { readOwnedConversationForRecipient } from "@/lib/messaging/readOwnedMessages";
import { selectActiveMode } from "@/store/authSlice";
import { useToast } from "@/lib/toast";

export function useOpenChat() {
  const router=useRouter(),client=useApolloClient(),toast=useToast(),generation=useRef(0);
  useFocusEffect(useCallback(()=>()=>{generation.current++;},[]));
  return useCallback(async(recipientId:string)=>{
    const auth=store.getState().auth,ownerId=auth.user?.id,revision=++generation.current;
    if(!ownerId||!auth.isAuthenticated||!auth.accessToken)return;
    const current=()=>{const authNow=store.getState().auth;return generation.current===revision&&sameAccountSession(ownerId,authNow.user?.id,authNow.isAuthenticated&&!!authNow.accessToken);};
    try{
      const existing=await readOwnedConversationForRecipient(ownerId,recipientId,{inbox:async()=>(await client.query({query:GET_CONVERSATIONS_QUERY,fetchPolicy:"no-cache",context:{accountOwnerId:ownerId,queryDeduplication:false}})).data?.getConversations,isCurrent:current});
      if(!current())return;
      if(existing)router.push({pathname:"/chat/[providerId]",params:{providerId:existing.id}});
      else{router.push(selectActiveMode(store.getState())==="provider"?"/provider/(tabs)/messages":"/(app)/(tabs)/messages");toast.info("New conversations are unavailable. Your saved messages are kept.");}
    }catch{if(current())toast.error("The conversation could not be loaded. Please try again later.");}
  },[client,router,toast]);
}
