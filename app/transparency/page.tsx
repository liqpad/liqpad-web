import type {Metadata} from 'next';
import {TransparencyDashboard} from '@/components/transparency-dashboard';
import {pageMetadata} from '@/lib/seo';

export const metadata:Metadata=pageMetadata({title:'Protocol Transparency',description:'Verify Liqpad protocol fee allocation, creator reserve separation, VVV staking, sVVV locking, and DIEM activity from on-chain data.',path:'/transparency'});
export default function TransparencyPage(){return <TransparencyDashboard/>}
