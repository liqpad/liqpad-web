import type {Metadata} from 'next';
import {TransparencyDashboard} from '@/components/transparency-dashboard';

export const metadata:Metadata={title:'Protocol Transparency',description:'Verify Liqpad protocol fee allocation and Venice capital activity on Base.'};
export default function TransparencyPage(){return <TransparencyDashboard/>}
