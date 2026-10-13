import { SampleAccount } from "@/lib/account/model";
import { Provider } from "@/lib/discovery/model";
/** The sample account owns Tobi's public profile in both modes. Accepted booking snapshots stay separate. */
export function withSampleAccount(provider:Provider,r?:SampleAccount):Provider{if(!r||provider.id!==r.providerId)return provider;return {...provider,name:r.profile.name,bio:r.profile.introduction,providerEnabled:provider.providerEnabled!==false&&r.providerStatus==="active"&&!r.deletion};}
