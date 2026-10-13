import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { SelectionChip } from "@/components/SelectionChip";
import { DesignIcon } from "@/components/DesignIcon";
import Colors from "@/constants/colors";
import { addDays, categories, dateLabel, futureDay, localDate, nextMonday, parseDay, SearchDraft } from "@/lib/discovery/model";
import { ds, Frame, Icon, IconButton, SummaryRow, TopBar } from "./Parts";

export function WhatField({ value,category,onChange,onCategory }: { value:string;category:string;onChange:(v:string)=>void;onCategory:(key:string,label:string)=>void }) {
  const widths=[90,82,79,81,94,93,101];
  return <><Input accessibilityLabel="Service or problem" placeholder="Describe your problem or search..." value={value} maxLength={160} onChangeText={onChange} icon={<DesignIcon name="search"/>} inputStyle={{fontSize:14,lineHeight:20}}/>
    <View style={styles.chips}>{categories.map((c,index)=><SelectionChip compact key={c.key} label={c.label} selected={category===c.key} onPress={()=>onCategory(c.key,c.label)} style={{width:widths[index]}}/>)}</View></>;
}
export function WhereField({ value,onChange,recent,onChoose,onLocation,locating }: {value:string;onChange:(v:string)=>void;recent:string[];onChoose:(v:string)=>void;onLocation:()=>void;locating?:boolean}) {
  return <><Input accessibilityLabel="Service area" placeholder="Search area or neighbourhood" value={value} maxLength={160} onChangeText={onChange} icon={<Icon name="search"/>} inputStyle={{fontSize:14,lineHeight:20}}/>
    <Pressable accessibilityRole="button" accessibilityLabel="Use current location" accessibilityState={{busy:!!locating,disabled:!!locating}} disabled={locating} onPress={onLocation} style={styles.locationRow}><View style={styles.pin}><Icon name="pin"/></View><View style={ds.flex}><AppText variant="body">{locating ? "Finding your location…" : "Use current location"}</AppText><AppText variant="captionRegular" color={Colors.textSecondary}>Allow location access to find your area</AppText></View></Pressable>
    {!!recent.length && <><AppText variant="caption" color={Colors.textSecondary}>Recent searches</AppText>{recent.filter(a=>!value || a.toLowerCase().includes(value.toLowerCase()) || a===value).map(area=><Pressable key={area} accessibilityRole="button" accessibilityLabel={"Choose area "+area} onPress={()=>onChoose(area)} style={styles.locationRow}><View style={styles.pin}><Icon name="pin"/></View><View style={ds.flex}><AppText variant="body">{area}</AppText><AppText variant="captionRegular" color={Colors.textSecondary}>Service area</AppText></View></Pressable>)}</>}
  </>;
}
export function Calendar({ value,onChange,blocked=[], layout="search" }: { value:string;onChange:(v:string)=>void;blocked?:string[];layout?:"search"|"appointment" }) {
  const today=new Date(); const selected=parseDay(value);
  const [month,setMonth]=useState(()=> new Date((selected ?? today).getFullYear(),(selected ?? today).getMonth(),1,12));
  const quick=[{title:"Today",date:today},{title:"Tomorrow",date:addDays(today,1)},{title:"Next Mon",date:nextMonday(today)}];
  const dates=Array.from({length:Math.ceil((new Date(month.getFullYear(),month.getMonth()+1,0).getDate()+month.getDay())/7)*7},(_,i)=> {
    const day=i-month.getDay()+1; return day>=1 && day<=new Date(month.getFullYear(),month.getMonth()+1,0).getDate() ? localDate(new Date(month.getFullYear(),month.getMonth(),day,12)) : null;
  });
  const unavailable=(date:string)=>!futureDay(date) || blocked.some(d=>d.slice(0,10)===date);
  const choose=(date:string)=> {onChange(date);const picked=parseDay(date)!;setMonth(new Date(picked.getFullYear(),picked.getMonth(),1,12));};
  const previous=()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1,12));
  const next=()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1,12));
  const previousDisabled=month.getFullYear()===today.getFullYear() && month.getMonth()===today.getMonth();
  return <View style={{gap:layout==="appointment"?16:8}}>{layout==="search" && <View style={[ds.row,{gap:8,flexWrap:"wrap"}]}>{quick.map(q=><Pressable key={q.title} accessibilityRole="button" accessibilityLabel={q.title+", "+dateLabel(localDate(q.date))} accessibilityState={{selected:value===localDate(q.date),disabled:unavailable(localDate(q.date))}} disabled={unavailable(localDate(q.date))} onPress={()=>choose(localDate(q.date))} style={[styles.quick,value===localDate(q.date)&&styles.quickSelected]}><AppText variant="caption" color={value===localDate(q.date)?Colors.textOnPrimary:Colors.textPrimary}>{q.title}</AppText><AppText variant="captionRegular" color={value===localDate(q.date)?Colors.textOnPrimary:Colors.textSecondary}>{dateLabel(localDate(q.date))}</AppText></Pressable>)}</View>}
    <View style={[ds.row,{justifyContent:"space-between",marginTop:layout==="appointment"?0:12}]}>{layout==="appointment" && <IconButton name="back" label="Previous month" disabled={previousDisabled} onPress={previous}/>}<AppText variant="label">{month.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</AppText>{layout==="search" ? <View style={[ds.row,{gap:0}]}><IconButton quietSmall name="back" label="Previous month" disabled={previousDisabled} onPress={previous}/><IconButton quietSmall name="next" label="Next month" onPress={next}/></View> : <IconButton name="next" label="Next month" onPress={next}/>}</View>
    <View style={[ds.row,{gap:0}]}>{["S","M","T","W","T","F","S"].map((day,index)=><AppText key={index} variant="captionRegular" color={Colors.textSecondary} style={styles.weekday}>{day}</AppText>)}</View>
    <View style={[styles.grid,layout==="appointment"&&{rowGap:4}]}>{dates.map((date,index)=>date ? <Pressable key={date} accessibilityRole="button" accessibilityLabel={parseDay(date)!.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})} accessibilityState={{selected:date===value,disabled:unavailable(date)}} disabled={unavailable(date)} onPress={()=>onChange(date)} style={styles.day}><View style={[styles.daySurface,layout==="appointment"&&{width:37,maxWidth:"84%"},date===value && styles.quickSelected]}><AppText variant="caption" color={date===value ? Colors.textOnPrimary : unavailable(date) ? Colors.disabled : Colors.textPrimary}>{Number(date.slice(-2))}</AppText></View></Pressable> : <View key={"blank"+index} style={styles.day}/>)}</View>
  </View>;
}
export function SearchScreen({ step,draft,onChange,onStep,onResults,onClose,recent,onLocation,locating }: { step:"what"|"where"|"when";draft:SearchDraft;onChange:(v:Partial<SearchDraft>)=>void;onStep:(v:"what"|"where"|"when")=>void;onResults:()=>void;onClose:()=>void;recent:string[];onLocation:()=>void;locating?:boolean }) {
  const ready=!!(draft.problem.trim() || draft.category) && !!draft.area.trim() && futureDay(draft.date);
  const next=()=>step==="what" ? onStep("where") : step==="where" && !futureDay(draft.date) ? onStep("when") : ready ? onResults() : onStep(draft.area.trim() ? "what" : "where");
  const changeProblem=(problem:string)=>onChange({problem,category:""});
  const label=categories.find(c=>c.key===draft.category)?.label ?? draft.problem;
  return <Frame header={<TopBar onClose={onClose}/>} footer={<View style={[ds.row,{justifyContent:"space-between"}]}><Pressable accessibilityRole="button" accessibilityLabel="Clear all search selections" onPress={()=>{onChange({problem:"",category:"",area:"",date:"",latitude:undefined,longitude:undefined});onStep("what");}} style={{minHeight:52,justifyContent:"center",paddingRight:16}}><AppText variant="label">Clear all</AppText></Pressable><Button title={ready && step!=="what" ? "Search providers" : "Next"} disabled={step==="what" ? !draft.problem.trim() && !draft.category : step==="where" ? !draft.area.trim() : !futureDay(draft.date)} onPress={next} style={{width:180,maxWidth:"68%"}}/></View>}>
    {step==="what" ? <View style={ds.panel}><AppText variant="h2">What do you need?</AppText><WhatField value={draft.problem} category={draft.category} onChange={changeProblem} onCategory={(category,problem)=>onChange({category,problem})}/></View> : <SummaryRow label="What" value={label || "Add service"} onPress={()=>onStep("what")}/>}
    {step==="when" ? <View style={[ds.panel,{paddingHorizontal:16,gap:8}]}><AppText variant="h2">When do you need it?</AppText><Calendar value={draft.date} onChange={date=>onChange({date})}/></View> : <SummaryRow label="When" value={dateLabel(draft.date)} onPress={()=>onStep("when")}/>}
    {step==="where" ? <View style={ds.panel}><AppText variant="h2">Where is the job?</AppText><WhereField value={draft.area} onChange={area=>onChange({area,latitude:undefined,longitude:undefined})} recent={recent} onChoose={area=>onChange({area,latitude:undefined,longitude:undefined})} onLocation={onLocation} locating={locating}/></View> : <SummaryRow label="Where" value={draft.area || "Add location"} onPress={()=>onStep("where")}/>}
  </Frame>;
}
const styles=StyleSheet.create({
  chips:{flexDirection:"row",flexWrap:"wrap",gap:10},locationRow:{minHeight:44,flexDirection:"row",gap:10,alignItems:"center"},pin:{width:32,height:32,borderRadius:8,backgroundColor:Colors.background,alignItems:"center",justifyContent:"center"},
  quick:{minWidth:68,minHeight:68,borderRadius:14,borderWidth:1,borderColor:Colors.border,paddingHorizontal:8,justifyContent:"center",alignItems:"center",gap:6},quickSelected:{backgroundColor:Colors.selected,borderColor:Colors.selected},weekday:{flex:1,textAlign:"center",height:24},grid:{flexDirection:"row",flexWrap:"wrap"},day:{width:"14.285714%",height:44,justifyContent:"center",alignItems:"center"},daySurface:{width:"84%",height:30,borderRadius:999,justifyContent:"center",alignItems:"center"},
});
